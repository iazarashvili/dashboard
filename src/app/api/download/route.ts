import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  const filePath = req.nextUrl.searchParams.get("path");
  if (!filePath) {
    return Response.json({ error: "Missing path parameter" }, { status: 400 });
  }

  try {
    const resolved = path.resolve(filePath);
    const content = await readFile(resolved, "utf-8");
    const fileName = path.basename(resolved);

    return new Response(content, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch {
    return Response.json({ error: "File not found" }, { status: 404 });
  }
}
