#!/bin/bash

echo "🔐 Generando NEXTAUTH_SECRET..."
echo ""

SECRET=$(openssl rand -base64 32)

echo "✅ Secret generado exitosamente:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$SECRET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Instrucciones:"
echo ""
echo "1. Copia el secret de arriba"
echo ""
echo "2. FRONTEND (.env.local):"
echo "   NEXTAUTH_SECRET=\"$SECRET\""
echo ""
echo "3. BACKEND (.env o variables de sistema):"
echo "   NEXTAUTH_SECRET=$SECRET"
echo ""
echo "⚠️  IMPORTANTE: Usa el MISMO secret en ambos lados"
echo ""
