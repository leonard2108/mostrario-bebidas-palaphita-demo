export default async function handler(req, res) {
  const ADMIN_PASSWORD = "dc-21-08"; // sua senha 

  if (req.method !== "POST")
    return res.status(405).json({ error: "Método não permitido" });

  const body = req.body;

  if (!body || !body.password)
    return res.status(400).json({ error: "Senha necessária" });

  if (body.password !== ADMIN_PASSWORD)
    return res.status(403).json({ error: "Senha incorreta" });

  const fs = require("fs");
  const path = require("path");

  const file = path.join(process.cwd(), "public-bg.json");

  fs.writeFileSync(file, JSON.stringify({
    bgUrl: body.bgUrl || "",
    bgFit: body.bgFit || "cover",
    bgPos: body.bgPos || "center center",
    bgOpacity: body.bgOpacity || "0.15"
  }, null, 2));

  res.status(200).json({ ok: true });
}
