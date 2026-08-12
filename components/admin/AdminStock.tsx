'use client';

import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bulkUpdateStock, StockUpdateItem } from '@/redux/adminSlice';
import { Upload, Download, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { AppDispatch, RootState } from '@/redux/store';
import { TokenGetter, withAuthRetry } from '@/lib/apiClient';
import axios from 'axios';
import * as XLSX from 'xlsx';

interface AdminStockProps {
  getToken: TokenGetter;
}

interface ParsedRow {
  sku: string;
  quantity: number;
  valid: boolean;
  error?: string;
}

export default function AdminStock({ getToken }: AdminStockProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.admin);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [uploadResult, setUploadResult] = useState<{
    updated: number;
    notFoundSkus: string[];
  } | null>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setFileName(file.name);
    setUploadResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        if (jsonData.length === 0) {
          toast.error('El archivo está vacío');
          return;
        }

        const firstRow = jsonData[0];
        const headers = Object.keys(firstRow);

        const skuHeader = headers.find((h) => h.trim().toUpperCase() === 'SKU');
        const stockHeader = headers.find((h) => h.trim().toUpperCase() === 'STOCK');

        if (!skuHeader || !stockHeader) {
          toast.error('El archivo debe tener las columnas "SKU" y "Stock"');
          return;
        }

        const rows: ParsedRow[] = jsonData.map((row) => {
          const sku = String(row[skuHeader] || '').trim();
          const rawStock = row[stockHeader];
          const quantity = Number(rawStock);

          if (!sku) {
            return { sku: '(vacío)', quantity: 0, valid: false, error: 'SKU vacío' };
          }
          if (isNaN(quantity) || quantity <= 0) {
            return { sku, quantity: 0, valid: false, error: 'Stock inválido' };
          }
          return { sku, quantity, valid: true };
        });

        setParsedData(rows);
        toast.success(`Archivo cargado: ${rows.filter((r) => r.valid).length} filas válidas`);
      } catch {
        toast.error('Error al leer el archivo');
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleSubmit = async () => {
    const validRows = parsedData.filter((r) => r.valid);
    if (validRows.length === 0) {
      toast.error('No hay filas válidas para procesar');
      return;
    }

    const seen = new Set<string>();
    const updates: StockUpdateItem[] = [];
    for (const r of validRows) {
      if (!seen.has(r.sku)) {
        seen.add(r.sku);
        updates.push({ sku: r.sku, quantity: r.quantity });
      }
    }

    try {
      const result = await dispatch(bulkUpdateStock({ updates, getToken })).unwrap();
      setUploadResult(result);
      setParsedData([]);
      setFileName('');
      if (result.notFoundSkus.length === 0) {
        toast.success(`Stock actualizado para ${result.updated} variante(s)`);
      } else {
        toast.error(
          `SKUs no encontrados (${result.notFoundSkus.length}): ${result.notFoundSkus.join(', ')}`
        );
      }
    } catch {
      toast.error('Error al actualizar stock');
    }
  };

  const handleDownloadBoilerplate = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/admin/all`
        : 'http://localhost:8080/products/admin/all';

      const { data: products } = await withAuthRetry(getToken, (token) =>
        axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      const rows: Record<string, string | number>[] = [];
      for (const product of products) {
        for (const variant of product.variants || []) {
          rows.push({
            SKU: variant.sku,
            Stock: '',
          });
        }
      }

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Stock');
      XLSX.writeFile(wb, 'boilerplate_stock.xlsx');
      toast.success('Boilerplate descargado');
    } catch {
      toast.error('Error al descargar boilerplate');
    }
  };

  const validCount = parsedData.filter((r) => r.valid).length;
  const invalidCount = parsedData.filter((r) => !r.valid).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#254642]">Carga masiva de stock</h2>
          <p className="text-sm text-gray-500">
            Subí un archivo .xlsx con las columnas &quot;SKU&quot; y &quot;Stock&quot; para aumentar
            el stock de las variantes.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#254642] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#1a3330] disabled:opacity-50">
          <Upload className="h-4 w-4" />
          Cargar archivo de stock
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            disabled={loading}
          />
        </label>

        <button
          type="button"
          onClick={handleDownloadBoilerplate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Descargar boilerplate
        </button>
      </div>

      {fileName && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
          Archivo: <span className="font-medium">{fileName}</span>
        </div>
      )}

      {parsedData.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-green-700">
              <CheckCircle className="h-4 w-4" />
              {validCount} fila(s) válida(s)
            </span>
            {invalidCount > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <AlertCircle className="h-4 w-4" />
                {invalidCount} fila(s) con error(es)
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">SKU</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">
                    Stock a agregar
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parsedData.map((row, i) => (
                  <tr key={i} className={row.valid ? 'bg-white' : 'bg-red-50'}>
                    <td className="px-4 py-2 font-mono text-xs">{row.sku}</td>
                    <td className="px-4 py-2 text-right">{row.valid ? row.quantity : '-'}</td>
                    <td className="px-4 py-2">
                      {row.valid ? (
                        <span className="text-green-600">OK</span>
                      ) : (
                        <span className="text-red-600">{row.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || validCount === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Confirmar actualización ({validCount} variante(s))
              </>
            )}
          </button>
        </div>
      )}

      {uploadResult && (
        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="font-medium text-[#254642]">Resultado de la operación</h3>
          <div className="flex items-center gap-1 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            {uploadResult.updated} variante(s) actualizada(s)
          </div>
          {uploadResult.notFoundSkus.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                SKUs no encontrados ({uploadResult.notFoundSkus.length}):
              </div>
              <ul className="max-h-40 list-inside list-disc overflow-auto text-xs text-red-500">
                {uploadResult.notFoundSkus.map((sku) => (
                  <li key={sku} className="font-mono">
                    {sku}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
