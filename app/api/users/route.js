import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

// firebase-admin exige runtime Node (não Edge); rota sempre dinâmica.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Verifica o Bearer token e exige que o chamador seja admin (role no Firestore). */
async function requireAdmin(request) {
  const authz = request.headers.get("authorization") || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) throw { status: 401, message: "Token de autenticação ausente." };

  const decoded = await adminAuth().verifyIdToken(token);
  const snap = await adminDb().collection("users").doc(decoded.uid).get();
  const role = snap.exists ? snap.data().role : null;
  if (role !== "admin") {
    throw { status: 403, message: "Acesso restrito a administradores." };
  }
  return decoded;
}

function fail(e) {
  if (e?.errorInfo?.code === "auth/email-already-exists") {
    return NextResponse.json({ error: "E-mail já cadastrado." }, { status: 409 });
  }
  const status = typeof e?.status === "number" ? e.status : 500;
  return NextResponse.json({ error: e?.message || "Erro interno." }, { status });
}

/** Lista os usuários cadastrados (coleção users). */
export async function GET(request) {
  try {
    await requireAdmin(request);
    const snap = await adminDb().collection("users").get();
    const users = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
    return NextResponse.json({ users });
  } catch (e) {
    return fail(e);
  }
}

/** Cria a conta no Auth + grava permissões no Firestore. */
export async function POST(request) {
  try {
    await requireAdmin(request);
    const { email, password, role, pipeline } = await request.json();

    if (!email || !password || !role) {
      throw { status: 400, message: "E-mail, senha e cargo são obrigatórios." };
    }
    if (!["admin", "unit"].includes(role)) {
      throw { status: 400, message: "Cargo inválido." };
    }
    if (role === "unit" && !pipeline) {
      throw { status: 400, message: "Informe a pipeline da unidade." };
    }

    const userRecord = await adminAuth().createUser({ email, password });

    const docData = { email, role };
    if (role === "unit") docData.pipeline = pipeline;
    await adminDb().collection("users").doc(userRecord.uid).set(docData);

    return NextResponse.json({ uid: userRecord.uid, ...docData });
  } catch (e) {
    return fail(e);
  }
}

/** Exclui o acesso: remove do Auth e da coleção users. */
export async function DELETE(request) {
  try {
    const caller = await requireAdmin(request);
    const { uid } = await request.json();
    if (!uid) throw { status: 400, message: "UID ausente." };
    if (uid === caller.uid) {
      throw { status: 400, message: "Você não pode excluir o próprio acesso." };
    }

    await adminAuth()
      .deleteUser(uid)
      .catch(() => {}); // ignora se já não existir no Auth
    await adminDb().collection("users").doc(uid).delete();

    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
