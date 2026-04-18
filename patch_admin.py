import re
import os

filepath = '/Users/tomasgonzalezh/Projects/fron-purosmates-next/components/OrdersPanel.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_block = """                        {!viewingOrderItems.user && (
                            <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="font-semibold text-gray-800 mb-3 border-b pb-2">Datos del Cliente</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500 text-xs uppercase tracking-wide">Nombre</p>
                                        <p className="font-medium text-gray-900">
                                            {viewingOrderItems.guestFirstname} {viewingOrderItems.guestLastname}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs uppercase tracking-wide">Email</p>
                                        <p className="font-medium text-gray-900">{viewingOrderItems.guestEmail || '-'}</p>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <p className="text-gray-500 text-xs uppercase tracking-wide">Teléfono</p>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-gray-900">{viewingOrderItems.guestPhone || '-'}</p>
                                            {viewingOrderItems.guestPhone && (
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(viewingOrderItems.guestPhone);
                                                        toast.success('Copiado');
                                                    }}
                                                    className="text-gray-400 hover:text-gray-600"
                                                    title="Copiar"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}"""

new_block = """                        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-800 mb-3 border-b pb-2">Datos del Cliente y Envío</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500 text-xs uppercase tracking-wide">Nombre</p>
                                    <p className="font-medium text-gray-900">
                                        {viewingOrderItems.user ? viewingOrderItems.user.name : `${viewingOrderItems.guestFirstname || ''} ${viewingOrderItems.guestLastname || ''}`}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs uppercase tracking-wide">Email</p>
                                    <p className="font-medium text-gray-900">{viewingOrderItems.user ? viewingOrderItems.user.email : (viewingOrderItems.guestEmail || '-')}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-gray-500 text-xs uppercase tracking-wide">Teléfono</p>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-900">{viewingOrderItems.user?.phoneNumber || viewingOrderItems.guestPhone || '-'}</p>
                                        {(viewingOrderItems.user?.phoneNumber || viewingOrderItems.guestPhone) && (
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(viewingOrderItems.user?.phoneNumber || viewingOrderItems.guestPhone);
                                                    toast.success('Copiado');
                                                }}
                                                className="text-gray-400 hover:text-gray-600"
                                                title="Copiar"
                                            >
                                                <Copy className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="span-col-1">
                                    <p className="text-gray-500 text-xs uppercase tracking-wide">Preferencia de envío</p>
                                    <p className="font-medium text-blue-800 bg-blue-100 rounded px-2 w-max mt-1 py-0.5">
                                        {viewingOrderItems.shippingPreference === 'correo' ? 'Correo Argentino' : (viewingOrderItems.shippingPreference === 'vendedor' ? 'Coordinar con vendedor' : 'No especificado')}
                                    </p>
                                </div>
                                {viewingOrderItems.shippingPreference === 'correo' && (
                                    <>
                                        <div>
                                            <p className="text-gray-500 text-xs uppercase tracking-wide">Localidad</p>
                                            <p className="font-medium text-gray-900">{viewingOrderItems.locality || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs uppercase tracking-wide">Dirección</p>
                                            <p className="font-medium text-gray-900">{viewingOrderItems.address || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs uppercase tracking-wide">Piso / Depto</p>
                                            <p className="font-medium text-gray-900">{viewingOrderItems.floorApartment || '-'}</p>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <p className="text-gray-500 text-xs uppercase tracking-wide">Indicaciones extras</p>
                                            <p className="font-medium text-gray-900">{viewingOrderItems.extraIndications || '-'}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>"""

if old_block in content:
    content = content.replace(old_block, new_block)
else:
    print("Warning: old_block not found exactly! Script failed to replace.")

with open(filepath, 'w') as f:
    f.write(content)
print("Patch applied to OrdersPanel.tsx")
