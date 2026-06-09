import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  const filePath = req.nextUrl.searchParams.get("path");
  if (!filePath) {
    return Response.json({ error: "Missing path" }, { status: 400 });
  }

  try {
    const resolved = path.resolve(filePath);
    const buffer = await readFile(resolved);
    const ext = path.extname(resolved).slice(1) || "png";
    const base64 = buffer.toString("base64");
    return Response.json({ data: `data:image/${ext};base64,${base64}` });
  } catch {
    return Response.json({ error: "File not found" }, { status: 404 });
  }
}
