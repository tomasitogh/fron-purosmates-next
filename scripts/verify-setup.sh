#!/bin/bash

echo "🔍 Verificando configuración de Auth.js..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Frontend checks
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "FRONTEND (Next.js)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "auth.ts" ]; then
    echo -e "${GREEN}✓${NC} auth.ts exists"
else
    echo -e "${RED}✗${NC} auth.ts missing"
fi

if [ -f "middleware.ts" ]; then
    echo -e "${GREEN}✓${NC} middleware.ts exists"
else
    echo -e "${RED}✗${NC} middleware.ts missing"
fi

if [ -f "prisma/schema.prisma" ]; then
    echo -e "${GREEN}✓${NC} Prisma schema exists"
else
    echo -e "${RED}✗${NC} Prisma schema missing"
fi

if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓${NC} .env.local exists"
    
    if grep -q "GOOGLE_CLIENT_ID=" .env.local; then
        if grep -q "tu-client-id" .env.local; then
            echo -e "${YELLOW}⚠${NC}  GOOGLE_CLIENT_ID needs configuration"
        else
            echo -e "${GREEN}✓${NC} GOOGLE_CLIENT_ID configured"
        fi
    else
        echo -e "${RED}✗${NC} GOOGLE_CLIENT_ID missing"
    fi
    
    if grep -q "DATABASE_URL=" .env.local; then
        if grep -q "usuario:password" .env.local; then
            echo -e "${YELLOW}⚠${NC}  DATABASE_URL needs configuration"
        else
            echo -e "${GREEN}✓${NC} DATABASE_URL configured"
        fi
    else
        echo -e "${RED}✗${NC} DATABASE_URL missing"
    fi
    
    if grep -q "NEXTAUTH_SECRET=" .env.local; then
        echo -e "${GREEN}✓${NC} NEXTAUTH_SECRET configured"
    else
        echo -e "${RED}✗${NC} NEXTAUTH_SECRET missing"
    fi
else
    echo -e "${RED}✗${NC} .env.local missing"
fi

echo ""

# Check if Prisma is initialized
if [ -d "node_modules/.prisma" ]; then
    echo -e "${GREEN}✓${NC} Prisma client generated"
else
    echo -e "${YELLOW}⚠${NC}  Prisma client not generated (run: npx prisma generate)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "BACKEND (Spring Boot)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

BACKEND_PATH="../back-purosmates/back-purosmates"

if [ -d "$BACKEND_PATH" ]; then
    echo -e "${GREEN}✓${NC} Backend directory exists"
    
    if [ -f "$BACKEND_PATH/src/main/java/com/uade/tpo/demo/controllers/config/AuthJsSecurityConfig.java" ]; then
        echo -e "${GREEN}✓${NC} AuthJsSecurityConfig.java exists"
    else
        echo -e "${RED}✗${NC} AuthJsSecurityConfig.java missing"
    fi
    
    if [ -f "$BACKEND_PATH/src/main/java/com/uade/tpo/demo/controllers/config/SecurityConfig.java.OLD" ]; then
        echo -e "${GREEN}✓${NC} Old SecurityConfig backed up"
    else
        echo -e "${YELLOW}⚠${NC}  Old SecurityConfig not backed up"
    fi
    
    if [ -d "$BACKEND_PATH/src/main/java/com/uade/tpo/demo/controllers/auth.OLD" ]; then
        echo -e "${GREEN}✓${NC} Old auth controllers backed up"
    else
        echo -e "${YELLOW}⚠${NC}  Old auth controllers not backed up"
    fi
else
    echo -e "${YELLOW}⚠${NC}  Backend directory not found at $BACKEND_PATH"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local"
echo "2. Configure DATABASE_URL in .env.local"
echo "3. Run: npx prisma db push"
echo "4. Run: npm run dev"
echo "5. Login with Google"
echo "6. Run: node scripts/promote-admin.js"
echo "7. Configure NEXTAUTH_SECRET in backend .env"
echo "8. Start backend: cd $BACKEND_PATH && ./mvnw spring-boot:run"
echo ""
echo "📚 See QUICKSTART.md for detailed instructions"
echo ""
