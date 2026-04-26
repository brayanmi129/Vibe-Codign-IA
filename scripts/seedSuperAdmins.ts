/**
 * Super Admin seeder
 *
 *   npm run seed:superadmin
 *
 * Qué hace:
 *  - Inicia sesión como admin@stockmaster.ai (cuenta del seed principal).
 *  - Escribe un documento superadmins/{email} por cada super admin.
 *
 * El documento ID es el EMAIL, no el UID.
 * Esto hace que el login sea híbrido: Google OAuth o email/contraseña
 * con el mismo correo → siempre se detecta como super admin.
 *
 * Prerequisito: haber ejecutado "npm run seed" al menos una vez.
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  inMemoryPersistence,
  setPersistence,
} from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json" with { type: "json" };

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(app);

// ─── Configuración ────────────────────────────────────────────────────────────

// Cuenta del seed — tiene permiso de escritura en superadmins según las reglas
const SEED_EMAIL    = "admin@stockmaster.ai";
const SEED_PASSWORD = "Admin#123";

// Emails que serán super admin — funciona con Google OAuth Y email/password
const SUPER_ADMINS = [
  { email: "bmirandah@ucentral.edu.co", displayName: "Brayan Miranda" },
  { email: "dgarcia5@ucentral.edu.co",  displayName: "Diego García"   },
];

// ─── Entry point ──────────────────────────────────────────────────────────────

async function run() {
  try {
    console.log("🛡️  StockMaster — Super Admin seeder\n");
    console.log("🔑 Autenticando como seed admin…");

    await setPersistence(auth, inMemoryPersistence);
    await signInWithEmailAndPassword(auth, SEED_EMAIL, SEED_PASSWORD);
    console.log("  ✅ Login OK\n");

    for (const sa of SUPER_ADMINS) {
      // Document ID = email (no UID) → funciona con cualquier proveedor de auth
      await setDoc(doc(db, "superadmins", sa.email), {
        email:       sa.email,
        displayName: sa.displayName,
        createdAt:   new Date().toISOString(),
      });
      console.log(`  ✅ superadmins/${sa.email}`);
    }

    console.log("\n═══════════════════════════════════════════════════");
    console.log("✨ Super Admins registrados:");
    console.log("───────────────────────────────────────────────────");
    for (const sa of SUPER_ADMINS) {
      console.log(`   ${sa.email}  (${sa.displayName})`);
    }
    console.log("\n   Login híbrido activo:");
    console.log("   • Google OAuth (cuenta universitaria)  ✓");
    console.log("   • Email + contraseña (misma dirección) ✓");
    console.log("═══════════════════════════════════════════════════\n");
    process.exit(0);
  } catch (error) {
    console.error("\n💥 Error:", error);
    console.error("   Asegúrate de haber ejecutado 'npm run seed' primero.");
    process.exit(1);
  }
}

run();
