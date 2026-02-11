import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 días
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // user solo está disponible en el primer login
      if (account && user) {
        // Guardar el ID Token de Google para validación en backend
        token.accessToken = account.id_token;

        // Buscar usuario en DB para obtener el rol
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { id: true, role: true },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.userId = dbUser.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Inyectar rol, userId y accessToken en la sesión
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.userId as string;
        session.user.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/", // Redirigir a home si no está autenticado
  },
});
