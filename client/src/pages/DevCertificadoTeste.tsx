// DEV ONLY - remover antes de producao.
// Pagina de visualizacao do certificado preenchido (Parte 1). So existe em dev
// (a rota em App.tsx e registrada sob import.meta.env.DEV). NAO vai no sitemap
// e nao deve ser indexavel. Mostra o SVG servido pelo endpoint de dev do server,
// o codigo de exemplo e a URL que o QR codifica, para conferir no scanner.

const SAMPLE_CODE = "BNT-TEST-0001";
const PREVIEW_URL = "/api/dev/certificate-preview.svg";
const VERIFY_URL = `https://boranatech.com.br/certificados/${SAMPLE_CODE}`;

export default function DevCertificadoTeste() {
  return (
    <div className="min-h-screen bg-[#faf8f4] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-800">
          Dev only
        </p>
        <h1 className="mt-1 font-display text-3xl font-black text-slate-950">
          Preview do certificado
        </h1>

        <div className="mt-6 rounded-[12px] border-[2.5px] border-slate-950 bg-white p-5 shadow-[4px_4px_0_#0f172a]">
          <p className="text-sm font-bold text-slate-700">
            Código de exemplo:{" "}
            <span className="font-black text-slate-950">{SAMPLE_CODE}</span>
          </p>
          <p className="mt-2 text-sm font-bold text-slate-700">
            O QR aponta para:{" "}
            <a
              href={VERIFY_URL}
              target="_blank"
              rel="noreferrer"
              className="break-all font-black text-violet-800 underline"
            >
              {VERIFY_URL}
            </a>
          </p>
          <a
            href={PREVIEW_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block rounded-[10px] border-[2.5px] border-slate-950 bg-[#FFB800] px-4 py-2 text-sm font-extrabold text-slate-950 shadow-[3px_3px_0_#0f172a]"
          >
            abrir SVG em nova aba
          </a>
        </div>

        <div className="mt-6 overflow-hidden rounded-[12px] border-[2.5px] border-slate-950 shadow-[6px_6px_0_#7c3aed]">
          <img
            src={PREVIEW_URL}
            alt="Preview do certificado preenchido"
            className="block w-full"
          />
        </div>
      </div>
    </div>
  );
}
