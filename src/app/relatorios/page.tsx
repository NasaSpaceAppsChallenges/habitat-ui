"use client";

import type { TouchEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAtomValue, useSetAtom } from "jotai";

import {
  missionReportAtom,
  moduleMakerConfigAtom,
  type MissionReportState,
} from "@/app/jotai/moduleMakerConfigAtom";
import { playerLanunchStatusAtom, type PlayerLaunchStatus } from "@/app/jotai/playerlaunchStatusAtom";
import { makeReportFileName, normalizeImages } from "@/app/playground/functions/helpers";

const formatModuleType = (value: string | undefined) => {
  if (!value) return "Módulo";
  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

const formatDateTime = (iso: string | undefined) => {
  if (!iso) return "--";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "--";
  }
};

const mockedImages = [
  "https://media.discordapp.net/attachments/1421271697742368881/1424434729410756748/img2.png?ex=68e3efb8&is=68e29e38&hm=8345f6790f80ab09b5dbf5c785f3c0b83dd14f3d169e9fe129fca10a108d25f8&=&format=webp&quality=lossless&width=387&height=582",
  "https://media.discordapp.net/attachments/1421271697742368881/1424434730182643803/img1.png?ex=68e3efb8&is=68e29e38&hm=8bd69b5d0828802b810e4443cd5fa52f10cd956a5a62336c21fe06525a59d69f&=&format=webp&quality=lossless&width=582&height=582",
];

export default function RelatoriosPage() {
  const missionReport = useAtomValue(missionReportAtom);
  const missionConfig = useAtomValue(moduleMakerConfigAtom);
  const playerLaunchStatus = useAtomValue(playerLanunchStatusAtom);
  const setPlayerLaunchStatus = useSetAtom(playerLanunchStatusAtom);
  const [isPdfModalOpen, setPdfModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageModalIndex, setImageModalIndex] = useState<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef(0);

  const defaultLaunchStatus: PlayerLaunchStatus = useMemo(() => {
    const timestamp = new Date().toISOString();
    return {
      phase: "failure",
      lastUpdatedAt: timestamp,
      response: {
        success: false,
        message: "Falha simulada: parâmetros críticos fora da faixa segura.",
        score: -25,
        pdfBase64: "JVBERi0xLjQKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgaHR0cDovL3d3dy5yZXBvcnRsYWIuY29tCjEgMCBvYmoKPDwKL0YxIDIgMCBSIC9GMiAzIDAgUiAvRjMgNCAwIFIgL0Y0IDYgMCBSIC9GNSA5IDAgUgo+PgplbmRvYmoKMiAwIG9iago8PAovQmFzZUZvbnQgL0hlbHZldGljYSAvRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZyAvTmFtZSAvRjEgL1N1YnR5cGUgL1R5cGUxIC9UeXBlIC9Gb250Cj4+CmVuZG9iagozIDAgb2JqCjw8Ci9CYXNlRm9udCAvSGVsdmV0aWNhLUJvbGQgL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcgL05hbWUgL0YyIC9TdWJ0eXBlIC9UeXBlMSAvVHlwZSAvRm9udAo+PgplbmRvYmoKNCAwIG9iago8PAovQmFzZUZvbnQgL1phcGZEaW5nYmF0cyAvTmFtZSAvRjMgL1N1YnR5cGUgL1R5cGUxIC9UeXBlIC9Gb250Cj4+CmVuZG9iago1IDAgb2JqCjw8Ci9Db250ZW50cyAzMCAwIFIgL01lZGlhQm94IFsgMCAwIDU5NS4yNzU2IDg0MS44ODk4IF0gL1BhcmVudCAyOSAwIFIgL1Jlc291cmNlcyA8PAovRm9udCAxIDAgUiAvUHJvY1NldCBbIC9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUkgXQo+PiAvUm90YXRlIDAgL1RyYW5zIDw8Cgo+PiAKICAvVHlwZSAvUGFnZQo+PgplbmRvYmoKNiAwIG9iago8PAovQmFzZUZvbnQgL0NvdXJpZXIgL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcgL05hbWUgL0Y0IC9TdWJ0eXBlIC9UeXBlMSAvVHlwZSAvRm9udAo+PgplbmRvYmoKNyAwIG9iago8PAovQ29udGVudHMgMzEgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUuMjc1NiA4NDEuODg5OCBdIC9QYXJlbnQgMjkgMCBSIC9SZXNvdXJjZXMgPDwKL0ZvbnQgMSAwIFIgL1Byb2NTZXQgWyAvUERGIC9UZXh0IC9JbWFnZUIgL0ltYWdlQyAvSW1hZ2VJIF0KPj4gL1JvdGF0ZSAwIC9UcmFucyA8PAoKPj4gCiAgL1R5cGUgL1BhZ2UKPj4KZW5kb2JqCjggMCBvYmoKPDwKL0NvbnRlbnRzIDMyIDAgUiAvTWVkaWFCb3ggWyAwIDAgNTk1LjI3NTYgODQxLjg4OTggXSAvUGFyZW50IDI5IDAgUiAvUmVzb3VyY2VzIDw8Ci9Gb250IDEgMCBSIC9Qcm9jU2V0IFsgL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSSBdCj4+IC9Sb3RhdGUgMCAvVHJhbnMgPDwKCj4+IAogIC9UeXBlIC9QYWdlCj4+CmVuZG9iago5IDAgb2JqCjw8Ci9CYXNlRm9udCAvSGVsdmV0aWNhLU9ibGlxdWUgL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcgL05hbWUgL0Y1IC9TdWJ0eXBlIC9UeXBlMSAvVHlwZSAvRm9udAo+PgplbmRvYmoKMTAgMCBvYmoKPDwKL0NvbnRlbnRzIDMzIDAgUiAvTWVkaWFCb3ggWyAwIDAgNTk1LjI3NTYgODQxLjg4OTggXSAvUGFyZW50IDI5IDAgUiAvUmVzb3VyY2VzIDw8Ci9Gb250IDEgMCBSIC9Qcm9jU2V0IFsgL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSSBdCj4+IC9Sb3RhdGUgMCAvVHJhbnMgPDwKCj4+IAogIC9UeXBlIC9QYWdlCj4+CmVuZG9iagoxMSAwIG9iago8PAovQ29udGVudHMgMzQgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUuMjc1NiA4NDEuODg5OCBdIC9QYXJlbnQgMjkgMCBSIC9SZXNvdXJjZXMgPDwKL0ZvbnQgMSAwIFIgL1Byb2NTZXQgWyAvUERGIC9UZXh0IC9JbWFnZUIgL0ltYWdlQyAvSW1hZ2VJIF0KPj4gL1JvdGF0ZSAwIC9UcmFucyA8PAoKPj4gCiAgL1R5cGUgL1BhZ2UKPj4KZW5kb2JqCjEyIDAgb2JqCjw8Ci9Db250ZW50cyAzNSAwIFIgL01lZGlhQm94IFsgMCAwIDU5NS4yNzU2IDg0MS44ODk4IF0gL1BhcmVudCAyOSAwIFIgL1Jlc291cmNlcyA8PAovRm9udCAxIDAgUiAvUHJvY1NldCBbIC9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUkgXQo+PiAvUm90YXRlIDAgL1RyYW5zIDw8Cgo+PiAKICAvVHlwZSAvUGFnZQo+PgplbmRvYmoKMTMgMCBvYmoKPDwKL091dGxpbmVzIDE1IDAgUiAvUGFnZU1vZGUgL1VzZU5vbmUgL1BhZ2VzIDI5IDAgUiAvVHlwZSAvQ2F0YWxvZwo+PgplbmRvYmoKMTQgMCBvYmoKPDwKL0F1dGhvciAoKSAvQ3JlYXRpb25EYXRlIChEOjIwMjUxMDA1MTQ0NzQwKzAwJzAwJykgL0NyZWF0b3IgKFwodW5zcGVjaWZpZWRcKSkgL0tleXdvcmRzICgpIC9Nb2REYXRlIChEOjIwMjUxMDA1MTQ0NzQwKzAwJzAwJykgL1Byb2R1Y2VyICh4aHRtbDJwZGYgPGh0dHBzOi8vZ2l0aHViLmNvbS94aHRtbDJwZGYveGh0bWwycGRmLz4pIAogIC9TdWJqZWN0ICgpIC9UaXRsZSAoRG9jdW1lbnRvKSAvVHJhcHBlZCAvRmFsc2UKPj4KZW5kb2JqCjE1IDAgb2JqCjw8Ci9Db3VudCA0IC9GaXJzdCAxNiAwIFIgL0xhc3QgMTYgMCBSIC9UeXBlIC9PdXRsaW5lcwo+PgplbmRvYmoKMTYgMCBvYmoKPDwKL0NvdW50IC02IC9EZXN0IFsgNSAwIFIgL0ZpdCBdIC9GaXJzdCAxNyAwIFIgL0xhc3QgMjggMCBSIC9QYXJlbnQgMTUgMCBSIC9UaXRsZSAoQXVyb3JhIE91dHBvc3QgXDIwNSBSZWxhdFwzNjNyaW8gZGUgU3VzdGVudGFiaWxpZGFkZSBlIE9wZXJhXDM0N1wzNDNvKQo+PgplbmRvYmoKMTcgMCBvYmoKPDwKL0Rlc3QgWyA1IDAgUiAvRml0IF0gL05leHQgMTggMCBSIC9QYXJlbnQgMTYgMCBSIC9UaXRsZSAoMS4gVmlzXDM0M28gR2VyYWwgZGEgTWlzc1wzNDNvKQo+PgplbmRvYmoKMTggMCBvYmoKPDwKL0Rlc3QgWyA1IDAgUiAvRml0IF0gL05leHQgMTkgMCBSIC9QYXJlbnQgMTYgMCBSIC9QcmV2IDE3IDAgUiAvVGl0bGUgKDIuIE9iamV0aXZvIEVzdHJhdFwzNTFnaWNvKQo+PgplbmRvYmoKMTkgMCBvYmoKPDwKL0NvdW50IC0xIC9EZXN0IFsgNSAwIFIgL0ZpdCBdIC9GaXJzdCAyMCAwIFIgL0xhc3QgMjAgMCBSIC9OZXh0IDIxIDAgUiAvUGFyZW50IDE2IDAgUiAKICAvUHJldiAxOCAwIFIgL1RpdGxlICgzLiBBcnF1aXRldHVyYSBkbyBIYWJpdGF0KQo+PgplbmRvYmoKMjAgMCBvYmoKPDwKL0Rlc3QgWyA3IDAgUiAvRml0IF0gL1BhcmVudCAxOSAwIFIgL1RpdGxlICgzLjEuIE1hcGEgZGUgRGlzdHJpYnVpXDM0N1wzNDNvIGRvcyBNXDM2M2R1bG9zKQo+PgplbmRvYmoKMjEgMCBvYmoKPDwKL0NvdW50IC01IC9EZXN0IFsgOCAwIFIgL0ZpdCBdIC9GaXJzdCAyMiAwIFIgL0xhc3QgMjYgMCBSIC9OZXh0IDI3IDAgUiAvUGFyZW50IDE2IDAgUiAKICAvUHJldiAxOSAwIFIgL1RpdGxlICg0LiBTdXN0ZW50YWJpbGlkYWRlIE9wZXJhY2lvbmFsKQo+PgplbmRvYmoKMjIgMCBvYmoKPDwKL0Rlc3QgWyA4IDAgUiAvRml0IF0gL05leHQgMjMgMCBSIC9QYXJlbnQgMjEgMCBSIC9UaXRsZSAoNC4xLiBDaWNsbyBkZSBcMzAxZ3VhKQo+PgplbmRvYmoKMjMgMCBvYmoKPDwKL0Rlc3QgWyAxMCAwIFIgL0ZpdCBdIC9OZXh0IDI0IDAgUiAvUGFyZW50IDIxIDAgUiAvUHJldiAyMiAwIFIgL1RpdGxlICg0LjIuIFByb2R1XDM0N1wzNDNvIGRlIEFsaW1lbnRvcykKPj4KZW5kb2JqCjI0IDAgb2JqCjw8Ci9EZXN0IFsgMTAgMCBSIC9GaXQgXSAvTmV4dCAyNSAwIFIgL1BhcmVudCAyMSAwIFIgL1ByZXYgMjMgMCBSIC9UaXRsZSAoNC4zLiBHZXJhXDM0N1wzNDNvIGUgR2VyZW5jaWFtZW50byBkZSBFbmVyZ2lhKQo+PgplbmRvYmoKMjUgMCBvYmoKPDwKL0Rlc3QgWyAxMSAwIFIgL0ZpdCBdIC9OZXh0IDI2IDAgUiAvUGFyZW50IDIxIDAgUiAvUHJldiAyNCAwIFIgL1RpdGxlICg0LjQuIENvbnRyb2xlIFRcMzUxcm1pY28gZSBSYWRpYXRpdm8pCj4+CmVuZG9iagoyNiAwIG9iago8PAovRGVzdCBbIDExIDAgUiAvRml0IF0gL1BhcmVudCAyMSAwIFIgL1ByZXYgMjUgMCBSIC9UaXRsZSAoNC41LiBHcmF2aWRhZGUgQXJ0aWZpY2lhbCBlIFNhXDM3MmRlIFBzaWNvbFwzNjNnaWNhKQo+PgplbmRvYmoKMjcgMCBvYmoKPDwKL0Rlc3QgWyAxMSAwIFIgL0ZpdCBdIC9OZXh0IDI4IDAgUiAvUGFyZW50IDE2IDAgUiAvUHJldiAyMSAwIFIgL1RpdGxlICg1LiBSZWxhY2lvbmFtZW50byBjb20gYSBNaXNzXDM0M28gVGVycmEpCj4+CmVuZG9iagoyOCAwIG9iago8PAovRGVzdCBbIDEyIDAgUiAvRml0IF0gL1BhcmVudCAxNiAwIFIgL1ByZXYgMjcgMCBSIC9UaXRsZSAoNi4gQ29uY2x1c1wzNDNvKQo+PgplbmRvYmoKMjkgMCBvYmoKPDwKL0NvdW50IDYgL0tpZHMgWyA1IDAgUiA3IDAgUiA4IDAgUiAxMCAwIFIgMTEgMCBSIDEyIDAgUiBdIC9UeXBlIC9QYWdlcwo+PgplbmRvYmoKMzAgMCBvYmoKPDwKL0ZpbHRlciBbIC9BU0NJSTg1RGVjb2RlIC9GbGF0ZURlY29kZSBdIC9MZW5ndGggMjEyNgo+PgpzdHJlYW0KR2IhO2RnTiklLCY6TzpTbSVgPzUpM2BSKGNDPFFKQmZlb0EsYXBqWyJYNSotKmczL3M7WHNQSkhQV0RKbD0qaHBQS1wsMlo2VGNebSxkVGUiOFsrajVNdUYjMVNXYz1vXWlQU0lSKDRjcScwZkdaaEpRKTQxZGBTS1U6U3QlTypQRzloI2ViN01CXyJMRVoqUXJUciI6SVdOSUlPIT9rK2UkaCw4cD1taSJxPThQPV8wU1FPNSk2ZXFYMSYtKllpa19vRS47SWdLPCouLixOdSFTJFovUCojSmwnV2I+YV90RSJYKGMuP1g4IVpER2M8WXUlRGwiPjM2Vi5BUlJJRSY+TmFlRThbI1VZLjo/YXNTIkpWXkRQNzcuQDhja1NtaVhTXmwjNUlXcSppJWlMQUVhO1tYYydPT2M3bnRgTnVpXk1pJFJJI1VTLiU5UjotVWNcZFdDcCJFcTtcRXVjSClKTUdMR011b01vJDEsZVpSZC40J1IwLXUyVjlIUTgkWE1vZyRvWEstVTJxZlo2RCx0SDEhcS0/WlVuVS9pU2o6SlVrI2Q3TUIqQF88RD5oSWlESzkyWWMqLjtibTlHSWRgclcyKUVVKk9VTjRfNzBcM2FbX1VAQ1UiV2tPZnRUXFxHXEY8J0ElRTtUQyEvUFxYSURsbStbQFFHUlNKOHUlN25tRmRfZyRTJXNjWUVUYjkubVNQKU5sT2QtJGRbTVskMjJXMDduIm5KR3BhNjArMjpTUU5tN2xIZF0kJ0IwKG8vP1lbKk85KiIrLShDIlpALkNvUyw7bTk+VXQvYjlPRWldW2UnIz5Pclg4LjtkWyxhJVk3VWU/dVA4JTskbmNCbTViIV8uM3BXbW9aZURJPlMvKTZwPis+YVNENEUkYHBbUz1HRjBqTD10Xiw1OXBrZ1pVXyUsJkFKM182K0JiJlgxR2tMW1U0Vl1MOVArJzJxXClWPTpUQEMrVyZjZW9sTEtGJk5VXFhrVFNPSjE8JlkwKUhWdTtFWjM0YFloOHMuLj5fLyReOFJWPUUxTEgiXU0kOnBnYixsMEdCYWVKJEQ+XDxSRjFORDIkSXJPPyVuNDdbTU1cYUMwdTAtS0FBQW5GbnAjay1QbUchJV1PZ2pVIjJOU0JhYmQncC5VZDFiNGVFYThtIWxtZnBRTnEsIWx1aFxqaVhKcnRdaic1YyElJj0uLGs7YWUoUE5sLy8jKVQuci8qclJdMnJhVk1VXG9LLkdXYD4oWi5VI2lwPENgcEYvIVwwMVgkbzFVbU9PLGRwJUY3bkElP1tqSClSNnE1R1Yxci86JFYsNDcmRVY+bl0mSSllKUBHMic+LyxeOk5OLF5pWWVrISdyZjU3XlFLR3FeL1YxSC9lVFcoN14kJWJ0QXIzIV9ma1Y7cUhRLG5hTGVNNyxvbEddUCpJZzdZLGMvblVpMydpNmZkTi86Xz8wQ1dkJUVrJFArX2tVQEVWPz9mOjY6VisqdT5MM2t0SURzX3RvdXA0IXI2P3JUb2g8OHNhYXRiN21NaFBwbFxPNlwiNm02OE5oRFJDUidhOU5ATm8jTEFiVEEqQXQpOFAlUUtsNk5HYEhXZktyQUIhQTxRLmcvPnIkOkEnTCw+IWliJycuWzIlMnI4NEohVG8qYDhfKkpiTW5DJWNjJGA8K1ErRjhAUV9sbThhcUtqREhNRT1zJGJnLSReLERMQmU8Q21NP0ZUNDdsQWFfYGhIMk5wPWIlT1cvR1BkaCxBYmNiMDYqWnBBWzNZZ2hDLkhCNEBuTEcvbHBmdEs2KEU5U1ZxU1wuXWtJa3BTXiNPIyEsPWEqImc4dC4hXywhNz91RSZFLm9QPE1wb0otRTk2O1AjKyhQNkNIQG91WWJwQkMyKkc0IURTckFmYj9DSztAIlFWclEoSGlOM05Fc2BDQi1YTy9KIXR0bEFCNGkuVkM6J18sPj1WWlFcYTMzVUg4dGpwZyVvTkNwJSZyUD47V2MyRU4ubk9jcCpIQUNaWVRiQjc0VV5dL0RhUilrRGBMQWteZEwpK1NvWEdaQik5IVUoamsiQkxSMEAoI1teISFrI1dKdXM4VGQ/XSNOUCJxW2UmXUVbUE5ZdT1ORkldODduLGFMPFFNaClPO29wQ0RqSjlOaCNDMmUpLlVdU2tiWyldXjdhVT1tImZWZCoqcDdxWytnUEMsPCZvUCZGa0hXL0wiW1kicUNMXlNVbnVLJGVoRC9oW2g/XyQndFhvRVBiVWQlYCtEO2IvQG4rVSsoMDNAPmw7JzBjbzxpOFNrO3F1ZilFLV5daFMhNWxaMEA0QWs/LjdVSVBxJ2wkdW9KTj9tZ2kyXWVwYTkxWyxnKy0sOENAInIlIXBJR2tOYlNgXCZlQnRjb1JRVWxNQlE9SGwmNC8oVGdDVW8yWidSQiItNWEzXGsnYXIpUDtCcEIjVk00UStuUC9rQnU3NmRZNVddR2UpI1FMJFdxI1NgSkZhMEphRVw2ZGolUmVITVA+PVgiNEpdJVRqM0dBT2UvVHBhXz09P1FwJylcQj44b29KQ3JJMkVPIVEkPyVWQT1qLjwnRzk4Zi5vTVkqJEx0USglanVaUFE+YT0jUVVdMFIiMjEsKm1fQEVDYFslbkFLYWRGOGQvQS0yMXRJcj4mP0ZIRSRzbTpvcSooTyI+UTdPU2ZKaSQ9ckk5Z2JPYFw5WklnKUJPKF8wWjpyM0FsNDUmbW9mX29RZUUjWzBNKTh1Iz9SbzpQLFw2QlNfXDlVLGZkVDZzJUQ4P1tlPS5jOjc3LnRdRHFQLSw9V1lBS1JDLk07W0srOnQ4Y01kayk7IjNvfj5lbmRzdHJlYW0KZW5kb2JqCjMxIDAgb2JqCjw8Ci9GaWx0ZXIgWyAvQVNDSUk4NURlY29kZSAvRmxhdGVEZWNvZGUgXSAvTGVuZ3RoIDE5OTkKPj4Kc3RyZWFtCkdiITtkZmxHaConUmZeV2kyTkpuLCkwNDBvclZBZE5dZz09Yip1YFwmbE9nU0tZa11Cb0NdY3NgRClYJGFKbXBuMjZxJlgvZE0raj88ZGdeKyghVXQ6KClfXVkwYCo5KGgmInMpaGFYImQtO09fPV4/SGRccU4qIj5FZF43Lzddb11VOy4tUlY7T0Y8YGI6NEAuaEUxJCkrYGM3KF1rSUM7WV1CU0Q5amRjbVZpayc2YFxOTyZHQGRhZCtANXRPcFQwbTw6Q0Y6R2slKmRVUTNgPkdVIl1bQVc4SHJHaSFDPU0rb1RAR3FVcmBRTlVMVFpIVylFJ00rT0xmTigscDVGTUVvYTk/Z3NgPm9EPjtDXSVQXF1pUUVQY0EyOjdtZ0onN1tgYGJcWlJwaUBEI1orVS4qNSpbNDJuOjhVMT5WXzVjPlFnX2FzVC9TW2cqV1drWTIqJ0FHMUM7Xy0oJlxQKTAlNCZrbCtdR05HVzNRRjs1VVVoaSZkSTlcKT9BS2dwQTItbVtwKTVcbTBQZ2ZvWTc2b0k3TVtlLGNHNipsVURSbzw8XmxuLnM4WzkpL2lhWUpCPHREQzVXTSMtZFlXPldkXXVeUls5Ri9dX0JrMCFjPCk2QW5rXWVfR0E9WFBEZF9oJkNMT1pLJCZCYS5jPztOV1JPZkdpY0EqX01PTDpFQDFtcT41S3Q1QiNYNTE8XVNWQ0UxR1BfIzROPkQrSDpeKEwwX01aKkRZVk0tSWdxW0ZqTFVWP0hAc15jWy00ZVI9MS5BLiZtdV1mWzBQQXRdQl05VERrb2FUMCVCY1ItdCgvRVghKFokckRrInIjaXBqSiVKYTxDYSJgOitYNmJlPjxjVmlvKWBINzhCZlY1bkBaLVdMP0hAXihPU1VsMjdoTzNJcCRgYi1tPjBZNFUyOGxwbWVLT1Y0XiZpaTtLbzolXT5fZ09tcEZzOCluJigjMCs8XEsuZzRRZzhNTCsnVShjT3BMImhwMigzQlgiK080N2c1XCw/JyxyR0guS1Y9YCMvPmdYR244MkJpVUFxP1lFJ05mOTUrbkklM0lzKFYvPjFsTk1OXDxRbk1RZ1hbMENqJGlCNi9uZlZwaTY8SD9eUkEkPDJuV0lwLjQ4MXBxb25ROCZSOEQrKkBLbkIxby85XztzPUpoQVldKTl1czM7PXQ9I08rKmswZVJpVTYyVV5hQ2U8S2FOS01TUWBEYEJiQ15JTFpIYGM1ZURmZWRUak9lKV0wV08/WVY6PllXUzM+blRRcXE4Z09SPDlHKlA5PjQiLSVALiotc1V1VFNwVUojODlLbmw6LlluRyJSSUVaTTxcRlhNMmdJJzFZN3EtcE5OSShlVDxiV00xdEw8RDtCTTZuM3FrKFRMXlVVMz4sVWBGcDZ1UmxHL0w7V2hRUy87OjtFLyNJTVFjYyc2PidtYGooQkRVRCZxLkRYW200Ji5zZi1vIUExOTZZMlVLT1JvPT9Wa0lYSV1sLD1wSk9uOjZjXlNcUXVAazReSWYxO2BEJDNGOHVfMWVbKSdQO0ckQGdyRGtFYFRJYWwscy9YUkpYVlc0JjpiMFBHRVtDS0ZCWEsmX19pM21XJklaTjdBW0BKQEQoKnRySFI2JG47LDxNdE9jKVFBTictTDE7Im4iK0gkaTopUUpgJEpRMHI+cEs5LFxmL0hpMCs2MEhXLnJoV29kRDgyN09vPyxeNERhWXBOMylFamtOMmNKXEdjWmtpPC9ORkdjdUIqNzMuZmdvSG5jZl0pPmZGTGBrTSplcVQhL3BjLkF1VHJIVUQjQHNLXldyRVZhLzA2MWEwMjopKiJeSSM4RXA9JGdhQVpyWjIzcWJOYk40NE08TDBMOWNGVU5YUnE+T1Y2cjEhXENBOyM/NFtYK1FYUlcwQWBYQ29KSEwiY1NMPkh1RSY8YmIxbm8+NjNDKjBfQyckOS5HZW9DSzAxJG5qVUwlKFJxSU0jJT4lWlNNZCVAJVxUXEdoXFZVNVNdSktmUi4qUzYvKEc3UyNUJGJMKFFmJ2oyYzEzVj9IaSk+UHJtMWA/Ry5Ja2pcMl1dLjVQX10uKmh0Tz4kZVZUa3NiPSYtKGVVcE1QaVEtJUJyUDFudGhpUkg6LUs4UC1kMHMmYV85cHNGcjBgTCZZKmBcOUI+OkhPRDxPQ1tqUzooYUFjIzY+NmRKQXRuLFBOW1QsVUMyNCUwWEo1ZGpobkV1aGY4W1heMkUxb2Y/RFsuJ21vX2xXTyZoTFFvUiw9QG8oUE1GOV47JTtmYkg8Q2AqR0RjRzE/LEFvRkxROis9V0lwSUZINVFIamEiLzZ1RGBMRUUkSSRbW2kjSy1OLEUsZVp1ZEAjWml0RzlrMW9AO3RIPlg6XSg8PGlZZWNnWU1Ub2tqK1BbR2cuZEY9ZzxgKFMycSUpTjEjO0MxJWxtKzpNNCdwMEsiJiJgZzElUGttWFgqQihmOSo/bEJPYm9nZFhqLyNSZm1HLTZkK0BoMWNDXmAkV3JtUlctazZnbkw4RD5rMlk3a3VYUyM3bi5ZbzpLMmphTyllWWQ0SEc+ZFFfNSswbGo+MC0wakZIZ1YidUM6OFBHPG1kNUcnbXFDcmJvITxsUEY1UTdFMG0wOExJJClfQWpASGpkbzBRTi4iMzBTSE0jfj5lbmRzdHJlYW0KZW5kb2JqCjMyIDAgb2JqCjw8Ci9GaWx0ZXIgWyAvQVNDSUk4NURlY29kZSAvRmxhdGVEZWNvZGUgXSAvTGVuZ3RoIDE5NDAKPj4Kc3RyZWFtCkdhdUhNOTY4aUcmQUokQ2k2aUxQO19cRWtrOnB0SEFpY0pzbTpeZ2ciWDUqLS4zQW1mM3BqXU5KZVVlPEg3WTwhT1trUURtJ2xib10pWycsUGRwM01dP2RpLGpOWC4rSDpKOzdhRWdMWG4rXkdsI0oiNCFJKGpsVjJhJ11ZWiw/TGQlZ2UtcS1oJXVVLzUzXDNbK2E9RT4yMmwyMnNNN0whIj5TQzFDXkonX2heW25KOiY2TDVvQ1xHWkdeMCtPPUNOcVtHIl5OXUU/aHFFSDpyJlVaQVIlUko8Mk81RVlVbGpTIl5LUCguImsiRS48TV9hKklbZ1hhOFlGND5FKWNqLCJOJG8qYnVEUCQlZEpTMCNwTzE1cClmJmdHPDFuZEI+amYzYkJHcD0kP2FURlZPJCJfXzBVLl1qXCw+UWBVPHFrRmc4Smk6dFxbRzZwcEg5YWYwViRwbmZSQEBuXCElUVtqS2QhUzJZdWwjWFU7QEpbcCxQQGUoXSNXWT5jYFNMY2lrPic0Q3NyO1BvNEcjUW1xYjtiQ2pWVjhtbCRDQmxSYjgzQ2tgOT8kPyk/SE5KTjphTjAhaSoyPEVvNSM+XV9VZjFbOTguPDhFRzdoTHFOPjw4YG1ERGZPJSY3ZmJLMEBEczBbdE5pcmpdcDNQRVA4Wm0kJnJIXyouJUNNOlcvLVF1SmlsV0dHXGJIKV47LVc9Py5xQkhCIlg5QV9TY1QzPyJbX2RaXFpNO0Nqbz1mKz5TITteRS9wI0cwT1lXSDtwTXFXTS47Wm5kcVdPLiRDVnQ4S2s1IjwsNTh1WG5QWzcpKSwiYE5sLiZGKj5WL2ZTYztKSk1nNGpTMXRBTm5BcEc6VSpXS2BTXFo3NnUjJG1UVFZVMWNsJ00sQmJrPzZYVmpjT1FIInJwXCtVVGYwa14iVllMWGJvNE1CQTY6anE6ZCdJWy8+TVIzS0JEX08pVShqLnFtZisiT2VScFYlZGpHJixXbzBeM05ISV8sPzdPSFktN0VaN2coMSFcMVEhXENJRS1SQ1M+Ok4xWWNJVCU4SDBqNUMsaWAuaj5rbjcyLWpLbGZwJjYhbVVjTSxqUGhBTDIqQCQoWT1wKXRxNTpbaCptaTRXVDIjSUA8dUlbQWIyaDU7Zyo9QU01IVJqX0U8cmIoL0FFOVZdNV0lLlsxWD5SRS9oYlFSLDguMHJcR29EP3RxVCFeazROLz5yYkwjTCdmVW9sTzVyYFFtMmJAPVI2MHFCKnFtRypmXl5NXGArYTtUW1piQzVnOlFrcE9mTGc2K21FKEBnOTBFKVNYOkNrbGpsbVZSV0k0WVNCVnUwN1tmKWFlUSNlUVZ1VzdyZTExRlc9LFltVW9kXjtvY3BFJV5pZGokUUImY3QpKS9gKFdrZkNZRjo+VXAjakRMaCU1VzpaPERdb1JTYTAncllGQFA1MSQqNDdLJ0ZDM1NILFwrJ1hyL2ldIyJJM2p0WExsRCE7P3JySjlcIjB0XHJwMyhIMWRNZ2Z0XDhiW2hMK181NTg3LWIrdEVPNm0pQVU2Yz0rUmMmVzheYmNCKERXImovckRNU3AjTyJHXSxNXTJUaz80R1cocnAsIm1JZmU4Ml5cKFNQWE4mUkhIbnMnZUJ0ZThsZTtmWTs8Q0IzaihdNycqTC8/XEpfM00xbWxeLmhoZSdyTm9pRmEiL0siW189RVQwQV0+bmxyWSlUazZkQ0ZfWzAnSmBHK0hSZGA3OlgnNyJIQi4uWGZJMTM1LlctIlYvJU5fMzZxQG1TTF9iQEg/XmphSGRpNzpdY0JJPTgsRidMbUVqMGRlL1xfXiknMGwlJ0hwMCJiK0FgaiQkTGJlQEdFJiVcMT1tXjRpKyIzYzpKR20rKkA0WDFbMC5NO2ZNJEwqQCEtYStZWjYjKV9vPilxYycpKFgsN0tuRUxKNGRiQDRQXD0wSFpob0VTMSFEJSdOYmpMTVtrN3AnbU1zY1s4Mj0wOF1xIShXLk4rM0ZYQV9MRWlBdGxBUDxeR11wU00mNXVBYyIkVVZBV0hwZTk5dDdia1hYbiZcXzJUNCVhYCQyLT9ERUFcK0kzLS8oNnIsOiNQX0BgcnIzV0ZnPi1sRG9rXz50ZS0vI05SN3FuWSonPztWbz0qXTlaKW0mWyRyTyVOby8yKFtIYDpwQUxBTC4ndT9eKlJVS2BCc2FYUmRuOSFYYD9qNjIqWzlpYWJRIlgnbCgtJDtoL3JuXEtkXGo6UWZeTDkxL1R0Y1Q3VXB0amhJITBpOm5lM0Q2ME1xTE1eYzhnU2hUSC5NZXBiYWpURCFlU1YuKVZlbk9uN01mdE1bcWIsPUkkX1BOOXRDQk04ZSlBY0ExQGRzY3JVZS1mSGYkQj5zUVhbUWYpYVEoKm5aLnJYLzwzVzA+Iz5iUSg5VmFYaVhqQXNFWjpLTjotRyE3WHQjTT5GZ15LXzspNywwI2tSWzBXZFpgJ2draSMjaj0uKVglZVktQWxYc1IsV3BRTCckWW1AZFhERjZjZE9XTHQzMHJpYjFeMURYV0RQZSRbRDZvVjIydGMjSzBAZyVwTltyIXRNcDUqdX4+ZW5kc3RyZWFtCmVuZG9iagozMyAwIG9iago8PAovRmlsdGVyIFsgL0FTQ0lJODVEZWNvZGUgL0ZsYXRlRGVjb2RlIF0gL0xlbmd0aCAyMjAxCj4+CnN0cmVhbQpHYiIvKD1gPCVTJjpWcy9SJFJtQiwjTGUiRzJMYEIuPF91ODJUTVMiQlNmU2c4PjheUmZjXCVZTFFucFlOX01OSUpwLE5VQmpicG0xYCw/TTlZZVZzYDtINUEhJD8rOmgkIWk9XzlGUW5eXjhyXUR0bkVxbyk3Vl5KJyIvNVJsYycxIlZIRlhfP2c+JTdwXDwkYyo+SmYySCFkKWBUcSZOcGBnbyZcKWxpclNPTWlsJWUybVw8c3AxQkZya1okM0Bbck1WXF0kcF9IU1AkR3EkdE8yTmx0Z0tKKjNHYGE8KWdNTWxsSDd0LTFnaG5tVnNcRzhLQkViVUtDKjE5NFdUYkRgLEMpMihRYyptWTQxXyZKXjohJkVtP1swXGQ2NjNhO2Q4QnQwOG8pXmQlWilTbFJhK3FqOytqLCFQMSg9QVkkMUVoYEcvZCRPW09RNm4uRDpoJSUrXEclPU5IWkRoO1owUiRJIVhBR2VEJSQkLlojblk9SE5faVZOZ0NUXmJfcT5jZ1wyJW1UY3BAZSdPQypcLyVvZE5GdDJOUExFIlhJJlo/JWNrRSZMRVZZVm5kPz81a0o7SkQuWzhAPylyQkQtZmwoWUMmdEM5L2dcaj9nbWpnbi4wJCxMSWEpWkkkRUVcRic4aDQ1IlkzVE5pJSxKOk9zNmdmayI4MUM9XWwsSGRdRmEuJEQsW2ZINk9zPVdDRGwrbko/QFlRRy0idGBZYW5MV2FNUS9SUF1vYnIvbWspTU5qaWk2QzNHNmFiQDhkOFd0WlIwQzJqJD1YLnMvUCdkamRdN2smQSYlIzE4RlVPI2JhbEdQalNWP2xiblNKJG1nYSE2LTxJNzEpSzRJT3VDSmJVP1Y/ISZAV0coVSQ7OlxJaEIsI1xgPUMiXkFHKmFuZEImLFwvKFJRWSIiaykpLSRaKFlbYDxJJkhaKHJiSWNpW0JATEtFSyw1LjlGT3BETjUzP1lJUWonNSZCRjpDUSEtWTxKUjxZcjg/Kz1sXWc8SEwjYVRVVEhjQ0UvZEFfN2c4XEhVQGhWYTBtWmVha2csZj1tX285YyI2Ll5MQD4lLz07bTEidSVXSUNVVnM4JTZoX0RNUUZyO05aV0V1akVWLjQ2aGxuViQ9PGBjZ0NjXS43X249RFluY1NNQWRsNEwpYE5sTV01LG4ubm5IR2ZUOk5sTV01LG4ubUklYWwpYkJUS1goRT1eRCxMbzEhYCwuMXAibUclZnRCc3E2IUc3OlhGSFUrVy0wPU06NF5FPFpeNlg1LEFoXC5zb1MmNFFUU08tJTVMTD11bDlXOz5YNi4jQCNCK14rMkcyUlRUSSRHbW1xSnFOSGs4XXUrV1A0Wi5kalozWihDZ2NGLm0hK19oJnMjOC85UnM1MzE7RWoqI20uIVhUTF1vcWluUUdvQl9KSlQ1KXAzQF1SMyZXPilqQzZwWlwkL2hSR3FnJGxpLyQ4QkJmXGN0PDI4QEU2XjMpOEA+VUI9YW5dKCQlPWNJc1YkbFxCYCJDJDNCT1ZoTz82TWpmJXQoLCE2I29LU0BvaF0oJmhfdGI3bC5pZFkubzAiVDsva1ZTZWc0KDM3T1NsRSNxOGVjRUtJTWROZTtAaz5mU1A5TFUyJylVWnBBRk0xVUEqcl5HLyYyNEFyOWldI2o4OlcrYS5qJStRcTo4UW1lKSlIVVBbVm9VSkExaTY4UVNQXHMqaDVrPztXQitlSG0vb1dPP1QudGVYZl89UUYiTVc+MVtQTC1MbV9iam49SzErbGBsdUVLbmhncVU8OkcoWE8iZi9xL3NZZlBPanQqME9jIklhL0NaS147a0ZJXW9BOGE9Y3A7QjwiYDdhXVRmPXVVQVRSL2BBNjRFaTZKLUs/PDpSS2AxJFhJX1lXISpiKWFHSTJIRW1HZDg6b2tRXTloUmkkRkpQcV1gZW1MdSdxVTE7IjVbYkFcMzhoOUpEazIoTzxOLFxHIk9cIktDKlVLQk8oN0RCSG45J1NgdVgwJk9STi9RbFNQYklpRC1MYUFNSWJCYkY0N0paW0pLcFReWEsxYzhfYU0rI1svZTxKWl9HNmxkNDAvbmQtI10jYERlTnVnaitfOSM3PTY7ak5JZEZCXj8laGNHZnAlJGhYJColPCtuMGEqJ25kWV84PVRtTUZpZzBySmpwSV9MUUFLKj1BdChIKV5lQzhjb2spVyVBJSglP2U6WnFTJmhFXTA1bCsmLzViKDBYUCstX09lZzk3PTlwJUNPOkEoKiYmJCFmT3I1YHFrN2puJ1JMOmM9YUY7QUlMPUhvbydVXCMxTFBPaCdsVz5tOiQ1KVwvJSp1cnRTVGxmK3UiKTRGPUZBQD5HUjtwODhBJldqIz1fXXUoXmssLWV1O2RCYW8hclR0ck4jSEYvMlgyXVgvYzpTOGlnPTgyWmBCX3JWIztTSEdGdEoyMUcuXHIqR3M3Wi1gXWE/RG41WHVbJmVvYUphSk1FNFovSFNNSFpGR0YhZzdwYCRpN3JlXjw8YSM4WTI/bmc6JCF1OE5sQnE8L2c1dDk2K0BoZXRncC1gLz5xaSdoYiExZTNOW0w1XVwoUkJuWiJrcUNEJ2FecD5zdGtnY204aFBiLD41V3BVaSVmWT5TQygzbD1iRitPWnJEM3A7PFNCIUdnMk4mYydaWUlUWkspS0tlXiJLU2lvYDdRQ2A9M1VyIjkqZTcpYTlULnREKj45KS8wcyViPFtuLU83RS8zIkU7KTdvNUVLZkUmLWNOTi5ecGNxXHEwSjg3UWBib0RhT1ZkbVs+OUktJlBBJlBUJyw5MCFHYTFTNl0sMS5ZUiw2azNMIylNdVVxbUlbMipOayROcC0sXDRgVUNkN3BXNUNOQl5iUE1yQE5ALm08cGE9LE1LbUVtSmVLLEQwTyQvTCVnMltFOlArLWNSdF5+PmVuZHN0cmVhbQplbmRvYmoKMzQgMCBvYmoKPDwKL0ZpbHRlciBbIC9BU0NJSTg1RGVjb2RlIC9GbGF0ZURlY29kZSBdIC9MZW5ndGggMjE2MAo+PgpzdHJlYW0KR2IhO2U4VFc/TydZYGEzXVpYOCM7YUZOdDRaQiM4IiNVZFNwdWtAQEMtLyE3QF8vQkVFMSNOSGhlVW8ubStAVmshTk09LUZ0WlgwclNBMFItTVZjT2hdc1JxM04pJkQ/I2kpczA/RlpuSkVEQC9lYm5lKmZkSF4vUygkNkRuVWk2Ry1qakgzJSInLkBZcyNBSEg/SFptMTlqZmtRSCZXSUtJc0M8ZGsqX0AyQ2pnUkwlSTs7RUVoaW5mQz5iSC03PSNbaklYLVsyR0EhMTknOTkwZTEyZ247OHBCX2grQXVGbWNuJGtpZSQ9ZTIjaiw3cGdhUihabTFTbSVAdGsoLEprKXVSK2QmR0AxcGA4QSgjZURqQGJjOixhNEtJWyQiVWdWOGJVLUFhaXJuOGgrLXM4ZVFqJS4uLURNT1pKJihAQTZBLDVVOFEkU09qWzBeSSJfRnJDM2FkVmJmNldGJm1haT4sQGpoWzIpMVdhW2ZuVz9xZCQnPDBgY0wmQGo/bDYob0xuIyxWLTVZSVRybFhrNDxxNURcanFRYUBPSlcvJmMsJzA3ckhwIVhaUygwXHIzJE1zRlE3J1hhJ0FUXExVRmhEcFUyLl82O0FZV0JARl1IOjQhQ29UMz1mKyJlW0whYV03ZjFbZydEUGIuRlhKKkc6ITE/JkgrPVMnUyNHTis5XWAhSGh0bFdaZ09sNTAxISdtaFtwdFNJb0ZCbTlUL2tAKz9TVXJfP0dBTEFAWzxmdCtpOSZOSG91MldKM1JYZks8Ol1AU0dbP1dXMyYuZFpdbkRQOlJ1SWlgT3VwNGFBNDRVQFY5YEZNMEEoV1NjNjEpXUZOQS1uKDdfcCdgLGtqQzFIYEZtMl5PXU9AJyFCSjpjRGdvNEU+RlJgVUVYXWdMaCUwTDMlWjBIJVVcNCQtNDIhVE5MI2FtZV1TPWwwK2FMRUxIaSY1SGxPXHRNUGxIS0tZXUpjbTswajk9NDVtc3RIOUsyMWlyQVtTSS85dCJVLTkoLFYlWDxdIzpoMF9XcWM9cTp0aVRnQmRpYVF0VTlEQko0PDlkRXVKdVVScFJgPFtaIj4kJDg+Ji4sUUo1OztuPClSUlowSXBqcTtQcVprVkdxOC8hJHEoPVM+YjFHbktoLWU2RV5NJz1sWi9hNSFWPFpTRlJRKyVDZ15cV09OJ0VIIVIpVUJsVDAiTUZzNSdscElQZV9vOVMrWSczblEtXVU4S0FKTk8+QS1MUys+ZDMwaTQzWDM7a1J0IVJNZnU0UkhJQUtnPj5GQD9hI1x1ZGQpPD1XYVxcc2xFXCtRNUQhJjVUPlxMU1hRdS0takVIVSRBR0BLbGNpUHIuYSR1REpSOGlVO1NXOGZiVS8hMTU1VCFWZzpyLjcmVk5hWWxaLEVIJkUuPyE3Xm5IQmMkPFdbc2guNiYkcyVQSTk/LChFKktVIzYrRFQ/WzhQTCVWNGwoSmxFVio4W1ovL04mYGxbYjtPTU04Lk1iaj8/XzteQ3JZLiJZNmE9XGdZZko0YidVXE0tRXBEI0s0QWhHTzNKLi0+WHU+bDUjWG9OXjFqPipncnM3MG1RQCsnNjEoWTolM0AhN2cpMzZVLVxsUywvNy0qSEckT0hzMmNiZlVYMWNNR0E/cFJoNmE/LiJtRHMlPVFVcTkrbjNQWSRkWGFiQSQ/Jk4yUlRDPSRJLXInN2JxOE1IcEoxNkA/Tlw9OnQ/aGBmWERoPVZUOl5fayJKMFIlKGNyYU8jRFpQNk49IydpaGY5bE5VL249RU0qdXQlZyNrMiI7SVBwPktaI0VkbS9GS2YtcF1gYiI8ay9fU2gnIy5bYTcmXCMqOV5Da1hDT2BxVz1KNUM9UlpTYlZBW1dtSUZ1PiZfMzAqJXVFMVFLWyptInFcOnE3J1ZOdE5zOVc6bHNNQD1mMyUiRT1sQDRvZT1HSSZZXEJZbiI6I0pyKCxNYlovIlRFX0suTzBfZVVhSE9nTTohI2coXik5bmBjW2ZWLCstYjEsWjZpNm9HYmsmPl08JkY6VixganJ0Yms3V1M8aGY3M2lEbzRaMjhfV10sLHJwPjA4VC4kN0xIaVhhVk5tLDteW3IwaSJeLzZuNDcjXFZxUFkrJWs4bFxGamFPNy4lXEpkS29eLD9fJF9McCZiQmRrKTdnQmZSLEszLDFUKjs9QU9sZ2EqM19TTDtrOktIcjk7SWtkRTR0J15lRSpBTiJoJSM4O1dnNVBjQyJfIVhwVTkpPmBhVmtnI2ZiLSVqU0lrWjFSTkZkZz5AY3IpKXM7Q0xpL009JXIsUSVBZElbJUZkNi4oKlxqclNAWGg6XSonNzRgQlZyWlAtSzB0KlRpWlFMUkpVPSpDInFNSUQ7WUcoRFdLaFdHUVBmbFJxX2Q7YSlOXFFBJSVnMjguUmYqIUVlQUZsTiwjL0FfJytIUEtESkciaGR1Ik4rP01FVjpNRVhnTj1taGUvZEdWKmNeUSwlSTQ2JC5pWEwqb1RPdExwVD41cDIyTjI5ZytZKzdaJzswKXF1LG8/PipoTSMlcz45NDolXT40MkJIPGhkK2tAdD1EJyp0QFVJZjlOcD0uK11xUnFFRTsjQD8/IkBKJ2pGNmsnIk5ISDpPLFM8LmNeRSM0R2AnSWNINlNzRFcvJWdlNFBSUkFVRipaRUxYOGNyQkgjdCQiV082UmNFUWwza1YiRF9bPSVHK3FHQEBMLENGaXU1RSJRSDJRMGIxJEY9N1poJGc2ISpaKUYjcDIkKUxzLV5ZLD9AUSgzOlYuamBHMl9xMEQ9QERtT2Ukbm80NkBHU3AkYnJKbkVvNlw0OFxAWzo8KnUzNEwuJXJIT20wNGVUJSY6VUpqRT1xXFE3Y19vX34+ZW5kc3RyZWFtCmVuZG9iagozNSAwIG9iago8PAovRmlsdGVyIFsgL0FTQ0lJODVEZWNvZGUgL0ZsYXRlRGVjb2RlIF0gL0xlbmd0aCAyMTc3Cj4+CnN0cmVhbQpHYXVITD5CZWdbJSI/TyteblxOKi5fOGBKaClEZjldJ1xqazlxMDI5Y2s8SDc3aFFQN28iK2hzIUwwW1RaXFs6dC03QT1QISFtdUk4LTg6cmBGJHNoTylvakcyZk5jdUpganFxKmtcPlVLVVkzYm8mZjt0bGwsbzo8bl5uQl8vY3FnXyhzZSppQShbOChFXjlPWXRFPyY8YTkuUm1xYSE6PHRNbFpVWE9fY0cxRCclR15dcEpPVitlZ2NNKmk6TlIkVkNYaV1BO1EvPVdKPlNJclxIKiZBPCosXkQqUWUoTDRndF1mbDA9OkFaRVc6PiFLWFZHXmQjVjNFTkJjVUxvUUI1IShlb0dNOjQycF1NaERuOFRrYjg+IlZOZVpbMVtmdXBZUXUzP0wzP2hETShyTmlgImJxYCdWR05XLVgiWE83LTBwU1hDJUE8VHByJGtsJF9XXkJuMzlTOCQscmlqVjU3bGVeU2drLW1ZP2t0OGwuM19MMzokdEddJkklOnJ0OjJyKyFoTT9qTFxIanA6cmJROG9CJHQ4LDxAU2pGP0JFYlJWO1xUJj1eZlcqMDxiVi1qQl0hWCNQb1pIUiFaZTA7LkN0XyZTSmFDZCExPGphJVFhck8nXi1DR1BVUCVcOXQ1RGFgOl1lZFZwSk4wTVxVLiVzWCFyN2BTdShuNkFZPSxNSDZSX1tDKnVuOCldUTteTEVhWChvVzNeX0pSS1pmUWtMWmotP1pTRzVmKDhzWmFvbSI0ZCQqSilHP1dvTkg/PCYxRidFUFJSIUUsMEAoVlY+Mj0jOzolYzZga09BXS5oTCZVdGYlV20jTzMpRWY0SUg/OVpzX0U+cGNKWzVsVmtTUUpIOFs7RVkwWUQ6ajtSP3BmUS8+WUxNP2o1cEJRRVwxWC4+PUs4LFNRVkJnXXVYdDg+UTRbbjs8b2U7KTIuUV1mMTBlJF00Ym8kY0NiSSksb1o1UF4tT09tVE9LLChcNz9jKFtqLzJTMGRBTFxmRmFmRFgjR1g0SWNTbT8iU0xkXVU1YVxKQkpXc1wtPkE2bV1gM10+UjthIW1rV2VcJ2Q9LjY/cHMzcGJnNFY2UzkxVW1rLCk3NyhlaSZZN1gwXTQhaE8zQ21xWEZhOzIjN15haSpFWVVMZChIYERiMTxYUk9IUDFsP2JkXmtZLS5iNTN1LV11JEJJVlFYPmtTaUlBZD1BV2JMLSInRW9WRmBJaWJoc0YoKUxbbjJzJVMsWDAvPDtRTEcyZ2xpUyc9cyZsNG44RXQoQHNYaVAlcGswWGlHLD11KmhrS1MzQ05QckpoT2IsLzdvO2N0Kk5QckpoT2hyWUthUVVuJkAvZ0xbYyhjWW43WnQzWWJhXCdjKU1yX1ksNl86TmsjXmYzKU1yX1ksREI6IW41N1A/cnM0InNVRjNFPFAuJT01Uyp1VUQzdV1DSj4/J2BkbCcyPDMpXkMmPlcqRy1ea1lLVGFUJTRlJWZjaTFlXUAyVjwvLkJMN2Q/bjQ2ZHR0LlclKWxpWlUwQj9qKmAmTU1UOSgtI2ZqUVJFWzhWJi1bME8hXFotTzlVJ1xuISRKTGlzdFNlTyFaKHM8cVtaKzl1R2hLZnJbUXU+aVdEJzleIVJraiVFOHVYOnA/MTlrcSZwbiNkQ0YuSWpSKikwVzMjPEllOF08MFplczI9PmVQOSdwVUtVRkVmXGRQXGdQTy8oX2xgJ0BoOE1DbW9mWkBQPVM2MS1iKidKT18rS1FaQzE7TClUJks1SShmaWwmZCVbXzk4cXE1S01GcEEnRSZFcj9fSD1fS0UqXG5wTztnOC5eLlQjX2FsNW9aSlUvMWFHZkFnJmE6QHJQWlBxZV8jXDA6UV5rTiRDT2hRbVBuTStQNCZlZCJlcTFoUFsxcCpPOnItPGpHSSMwOCZeQC07VD9oWjRFLiUyRSVqVCQnbEVFO0MmOWZYI2dPIUlrUnAmcGszKj0oTW8xcGEoZ3ItVWk3RDY4bituQD5eI1EoMV9YWWtfaWxBNFhxJFJ0V3NdWnEqVFJaXEJUSE4hTlEwKSlPKyEpTiZfZE1tMGRVSDpsZlxJYUhhWHMiOkkrajM2MUVZVUNpUWc5OFVJZVZyTTMiSTAwMDRgLT1FPVNea0U9STpOTmAnZFhASGhTX00tTk9RIkVfO05QTkI3LC1gJy1iZyJsc0BGb0VVcU4xZGBGPWZVZWZcWk4yJnVkXkl0Z0pyUSkiR1svPGBWVydRPlY7W3FZKCZKTC1yIjZFbU9dVCRRKkk1Pm4jcTBaUE4qOCNOQj4yVmk4JG09b2hYaWlhaitCP1csRDRoalZkbylkLXBJIiJaIztCUmc3dGNmXW5bTkJQXVgzTUZWKFNDSUV1VXVsUEdwbDBGKFhCRyYvPjpRXkxnaj1hIS9fJG0rXS1TRG0pLytbQ1skOC5WVDoxbSE8QF8kc0pncnBdRFhoTEY2WFVWNCJAa1dsVG8wVjRPTSgoI3QlLj5kZjMsLGUtcTpCPGhNUCtVbSRdK0lsWDNMJ2pqTV9bWmZXNywlLWFXcnBDKi1qKiJlRT0lTEFtUV1ccjZUTF80ay00YyUwXT9VaV9CXHFJPUZdXTdPJUZ0IWk3ZzYjRXI9OiJnMUskNXQ6OVhSVVlSVUFobVlyZmcoclZgL2U+SV0xIkdDYVE0VSNQPTdsaihDLT9LZzxKMmRFWyg9MWoiM1w5SyVBOF8nPjNGUVBoLGtXLWBnVGBiQm1aWFNCY2YlLXNrPyciYTVDMVJqP05MQjg1PStkYk06IVVDJE1bJzA3dFxnU1EiQS9ycHQ7Jz5ETmhocVRpbVFfLzBRUW8ydFVKOFctLU1HRyRxNVktZipiazRgIUYyPCkhY28pXUBCRkxNXTAmWig8cl9EIT9+PmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDM2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDA3MyAwMDAwMCBuIAowMDAwMDAwMTQ0IDAwMDAwIG4gCjAwMDAwMDAyNTEgMDAwMDAgbiAKMDAwMDAwMDM2MyAwMDAwMCBuIAowMDAwMDAwNDQ2IDAwMDAwIG4gCjAwMDAwMDA2NTEgMDAwMDAgbiAKMDAwMDAwMDc1NiAwMDAwMCBuIAowMDAwMDAwOTYxIDAwMDAwIG4gCjAwMDAwMDExNjYgMDAwMDAgbiAKMDAwMDAwMTI4MSAwMDAwMCBuIAowMDAwMDAxNDg3IDAwMDAwIG4gCjAwMDAwMDE2OTMgMDAwMDAgbiAKMDAwMDAwMTg5OSAwMDAwMCBuIAowMDAwMDAxOTg2IDAwMDAwIG4gCjAwMDAwMDIyNDggMDAwMDAgbiAKMDAwMDAwMjMyMiAwMDAwMCBuIAowMDAwMDAyNDk2IDAwMDAwIG4gCjAwMDAwMDI2MDcgMDAwMDAgbiAKMDAwMDAwMjcyNyAwMDAwMCBuIAowMDAwMDAyODg2IDAwMDAwIG4gCjAwMDAwMDMwMDAgMDAwMDAgbiAKMDAwMDAwMzE2NSAwMDAwMCBuIAowMDAwMDAzMjY3IDAwMDAwIG4gCjAwMDAwMDMzOTQgMDAwMDAgbiAKMDAwMDAwMzUzNCAwMDAwMCBuIAowMDAwMDAzNjY1IDAwMDAwIG4gCjAwMDAwMDM3OTggMDAwMDAgbiAKMDAwMDAwMzkzMiAwMDAwMCBuIAowMDAwMDA0MDI5IDAwMDAwIG4gCjAwMDAwMDQxMjIgMDAwMDAgbiAKMDAwMDAwNjM0MCAwMDAwMCBuIAowMDAwMDA4NDMxIDAwMDAwIG4gCjAwMDAwMTA0NjMgMDAwMDAgbiAKMDAwMDAxMjc1NiAwMDAwMCBuIAowMDAwMDE1MDA4IDAwMDAwIG4gCnRyYWlsZXIKPDwKL0lEIApbPDUwYzE4MDRmZWVhODdhOTNmOTU5MWNiNGIwZjg3MTgyPjw1MGMxODA0ZmVlYTg3YTkzZjk1OTFjYjRiMGY4NzE4Mj5dCiUgUmVwb3J0TGFiIGdlbmVyYXRlZCBQREYgZG9jdW1lbnQgLS0gZGlnZXN0IChodHRwOi8vd3d3LnJlcG9ydGxhYi5jb20pCgovSW5mbyAxNCAwIFIKL1Jvb3QgMTMgMCBSCi9TaXplIDM2Cj4+CnN0YXJ0eHJlZgoxNzI3NwolJUVPRgo=",
        images: [],
        worsePoints: [
          {
            moduleType: "private_crew_quarters",
            withModuleType: "dedicated_wcs",
            points: -81,
            reason:
              "O sistema de coleta de resíduos (banheiro) é a principal fonte de contaminação biológica e odores no habitat, além de gerar ruído. Para garantir a higiene e um ambiente de descanso saudável, esta área deve ser mantida o mais longe possível dos aposentos privados.",
          },
          {
            moduleType: "dedicated_wcs",
            withModuleType: "private_crew_quarters",
            points: -81,
            reason:
              "A proximidade é inaceitável. Odores, ruído e o risco de contaminação tornam o ambiente dos aposentos insalubre e impossibilitam o descanso, comprometendo diretamente a saúde e o bem-estar da tripulação.",
          },
          {
            moduleType: "common_kitchen_and_mess",
            withModuleType: "dedicated_wcs",
            points: -79,
            reason:
              "A cozinha é a principal área \"limpa\" para preparação e consumo de alimentos. O banheiro (WCS) é a principal fonte de contaminação biológica e odores. Mantê-los o mais longe possível é fundamental para a saúde da tripulação e para evitar a contaminação cruzada.",
          },
        ],
        improvementPoints: [
          {
            moduleType: "dedicated_storage_logistics",
            withModuleType: "radiation_shelter",
            points: 77,
            reason:
              "O abrigo contra radiação precisa ser abastecido com suprimentos de emergência (comida, água, kits médicos). Além disso, a própria massa dos itens armazenados (especialmente água) pode ser usada para construir ou reforçar a blindagem do abrigo, tornando a proximidade um fator de segurança vital.",
          },
          {
            moduleType: "radiation_shelter",
            withModuleType: "dedicated_storage_logistics",
            points: 77,
            reason:
              "A massa dos suprimentos armazenados (especialmente água e comida) fornece uma excelente blindagem contra radiação. Co-localizar o abrigo com a área principal de armazenamento permite que essa massa seja usada como um componente primário da construção e reforço do abrigo.",
          },
          {
            moduleType: "permanent_exercise_area",
            withModuleType: "full_hygiene_station",
            points: 67,
            reason:
              "Esta é a combinação mais eficiente e desejável. Após o exercício, a tripulação precisa se limpar imediatamente. Ter a estação de higiene ao lado contém o suor em uma única zona \"suja\" e cria um fluxo de trabalho perfeito, melhorando o conforto e a higiene geral.",
          },
        ],
      },
    } satisfies PlayerLaunchStatus;
  }, []);


  useEffect(() => {
    if (playerLaunchStatus.response) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.sessionStorage.getItem("player-launch-status");
      if (stored) {
        const parsed = JSON.parse(stored) as PlayerLaunchStatus | null;
        if (parsed?.response) {
          setPlayerLaunchStatus(parsed);
          return;
        }
      }
      setPlayerLaunchStatus(defaultLaunchStatus);
    } catch (storageError) {
      console.warn("Não foi possível restaurar o status do lançamento da sessão.", storageError);
      setPlayerLaunchStatus(defaultLaunchStatus);
    }
  }, [defaultLaunchStatus, playerLaunchStatus.response, setPlayerLaunchStatus]);

  const fallbackReport = useMemo<MissionReportState | null>(() => {
    const response = playerLaunchStatus.response;
    if (!response) return null;

    const normalizedImages = normalizeImages(response.images);
    const hasPdf = Boolean(response.pdfBase64);

    const status: MissionReportState["status"] =
      playerLaunchStatus.phase === "success"
        ? "success"
        : playerLaunchStatus.phase === "failure"
        ? "error"
        : response.success
        ? "success"
        : "error";

    const message =
      response.message ??
      (status === "success" ? "Plano aprovado." : "Plano rejeitado.");

    return {
      status,
      message,
      score: Number.isFinite(response.score) ? response.score : 0,
      pdf: hasPdf
        ? {
            base64: response.pdfBase64,
            mimeType: response.pdfMimeType ?? "application/pdf",
            fileName: response.pdfFileName ?? makeReportFileName(missionConfig.name),
          }
        : null,
      images: normalizedImages.map(({ name, base64, mimeType }) => ({ name, base64, mimeType })),
      gallery: normalizedImages.map((entry) => entry.dataUrl),
      worsePoints: response.worsePoints ?? [],
      improvementPoints: response.improvementPoints ?? [],
    } satisfies MissionReportState;
  }, [missionConfig.name, playerLaunchStatus]);

  const effectiveReport = missionReport ?? fallbackReport;

  const pdfHref = useMemo(() => {
    if (!effectiveReport?.pdf) return null;
    return `data:${effectiveReport.pdf.mimeType};base64,${effectiveReport.pdf.base64}`;
  }, [effectiveReport?.pdf]);

  useEffect(() => {
    if (!pdfHref && isPdfModalOpen) {
      setPdfModalOpen(false);
    }
  }, [isPdfModalOpen, pdfHref]);

  useEffect(() => {
    if (!isPdfModalOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPdfModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPdfModalOpen]);

  useEffect(() => {
    if (imageModalIndex === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setImageModalIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [imageModalIndex]);

  const galleryItems = useMemo(() => {
    if (effectiveReport?.gallery?.length) {
      const images = effectiveReport.images ?? [];
      return effectiveReport.gallery.map((src, index) => ({
        src,
        name: images[index]?.name ?? `Imagem ${index + 1}`,
        isMock: false,
      }));
    }

    return mockedImages.map((src, index) => ({
      src,
      name: `Imagem ${index + 1}`,
      isMock: true,
    }));
  }, [effectiveReport]);

  useEffect(() => {
    if (!galleryItems.length) {
      setActiveImageIndex(0);
      setImageModalIndex(null);
      return;
    }

    setActiveImageIndex((current) => Math.min(current, galleryItems.length - 1));
    setImageModalIndex((current) => {
      if (current === null) {
        return current;
      }

      return current >= galleryItems.length ? galleryItems.length - 1 : current;
    });
  }, [galleryItems]);

  const showPreviousImage = () => {
    setActiveImageIndex((current) => Math.max(current - 1, 0));
  };

  const showNextImage = () => {
    setActiveImageIndex((current) => Math.min(current + 1, galleryItems.length - 1));
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.touches[0].clientX;
    touchDeltaXRef.current = 0;
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) {
      return;
    }

    touchDeltaXRef.current = event.touches[0].clientX - touchStartXRef.current;
  };

  const handleTouchEnd = () => {
    const delta = touchDeltaXRef.current;
    if (Math.abs(delta) > 50) {
      if (delta > 0) {
        showPreviousImage();
      } else {
        showNextImage();
      }
    }

    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
  };

  const statusLabel = useMemo(() => {
    if (playerLaunchStatus.phase === "launching") {
      return "Avaliando plano";
    }
    if (effectiveReport) {
      return effectiveReport.status === "success" ? "Missão nominal" : "Plano reprovado";
    }
    return "Aguardando lançamento";
  }, [effectiveReport, playerLaunchStatus.phase]);

  const summary = useMemo(() => {
    const crewSize = missionConfig.crewSize ?? 0;
    const lastUpdatedAt = playerLaunchStatus.lastUpdatedAt;

    return [
      { label: "Status", value: statusLabel },
      {
        label: "Pontuação",
        value: effectiveReport ? effectiveReport.score.toLocaleString("pt-BR") : "--",
      },
      {
        label: "Tripulação",
        value: crewSize > 0 ? `${crewSize} integrante${crewSize > 1 ? "s" : ""}` : "Não informado",
      },
      {
        label: "Última atualização",
        value: lastUpdatedAt ? formatDateTime(lastUpdatedAt) : "--",
      },
    ];
  }, [effectiveReport, missionConfig.crewSize, playerLaunchStatus.lastUpdatedAt, statusLabel]);

  const improvementPoints = effectiveReport?.improvementPoints ?? [];
  const worsePoints = effectiveReport?.worsePoints ?? [];
  const hasRelationshipContent = improvementPoints.length > 0 || worsePoints.length > 0;
  const isImageModalOpen = imageModalIndex !== null && Boolean(galleryItems[imageModalIndex]);
  const modalImage = isImageModalOpen && imageModalIndex !== null ? galleryItems[imageModalIndex] : null;

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-cyan-50 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-16 sm:px-8">
        <header className="space-y-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-300/70">Relatório de Missão</span>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{missionConfig.name || "Habitat Orbital"}</h1>
          <p className="mx-auto max-w-2xl text-sm text-cyan-100/80 sm:text-base">
            {effectiveReport?.message ??
              (playerLaunchStatus.phase === "launching"
                ? "Estamos avaliando o seu plano junto ao serviço oficial. Aguarde alguns instantes."
                : "Finalize o plano de habitat no playground e lance para gerar um relatório detalhado.")}
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          {summary.map((item) => (
            <div
              key={item.label}
              className="flex min-h-[96px] flex-col justify-between rounded-2xl border border-cyan-500/20 bg-slate-900/70 px-6 py-4 shadow-[0_0_35px_rgba(14,165,233,0.12)]"
            >
              <span className="text-xs font-medium uppercase tracking-[0.3em] text-cyan-300/70">{item.label}</span>
              <span className="text-lg font-semibold text-white">{item.value}</span>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-6 rounded-3xl border border-cyan-500/25 bg-slate-900/60 px-6 py-8 shadow-[0_0_60px_rgba(14,165,233,0.15)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Relatório consolidado</h2>
              <p className="text-sm text-cyan-100/80">Baixe o PDF gerado com a análise do plano.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {pdfHref ? (
                <>
                  <button
                    type="button"
                    onClick={() => setPdfModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-full border border-cyan-400/50 bg-transparent px-5 py-2 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-50"
                  >
                    Visualizar PDF
                  </button>
                </>
              ) : (
                <span className="text-xs text-cyan-100/60">PDF indisponível até a próxima simulação.</span>
              )}
              <Link
                href="/playground"
                className="inline-flex items-center justify-center rounded-full border border-cyan-400/50 bg-transparent px-5 py-2 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-50"
              >
                Retornar ao Playground
              </Link>
            </div>
          </div>

          <div className="min-h-[220px] rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4">
            {galleryItems.length ? (
              <div className="relative h-full">
                <div
                  className="relative h-full overflow-hidden rounded-2xl border border-cyan-500/15 bg-slate-900/80"
                >
                  <div
                    className="flex h-full w-full transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${activeImageIndex * 100}%)` }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    {galleryItems.map((item, index) => (
                      <figure
                        key={`${item.src}-${index}`}
                        className="relative flex h-full w-full shrink-0 flex-col"
                      >
                        <button
                          type="button"
                          className="relative h-60 w-full flex-1 overflow-hidden"
                          onClick={() => setImageModalIndex(index)}
                          aria-label={`Visualizar imagem ${index + 1} em tela cheia`}
                        >
                          <Image
                            src={item.src}
                            alt={`Pré-visualização ${index + 1} - ${item.name}`}
                            fill
                            sizes="(max-width: 640px) 100vw, 600px"
                            className="object-cover"
                            unoptimized
                          />
                        </button>
                        <figcaption className="flex items-center justify-between px-4 py-3 text-xs uppercase tracking-[0.22em] text-cyan-200/70">
                          <span className="truncate" title={item.name}>
                            {item.name}
                          </span>
                          {item.isMock ? (
                            <span className="ml-2 shrink-0 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[0.55rem] font-semibold tracking-[0.3em] text-cyan-100/80">
                              Mock
                            </span>
                          ) : null}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>

                {galleryItems.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={showPreviousImage}
                      className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full border border-cyan-500/40 bg-slate-900/70 p-2 text-cyan-100 shadow-lg transition hover:border-cyan-300/60 hover:text-cyan-50 disabled:cursor-not-allowed disabled:border-cyan-500/10 disabled:text-cyan-500/30"
                      disabled={activeImageIndex === 0}
                      aria-label="Imagem anterior"
                    >
                      <span className="text-lg">&#8592;</span>
                    </button>
                    <button
                      type="button"
                      onClick={showNextImage}
                      className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full border border-cyan-500/40 bg-slate-900/70 p-2 text-cyan-100 shadow-lg transition hover:border-cyan-300/60 hover:text-cyan-50 disabled:cursor-not-allowed disabled:border-cyan-500/10 disabled:text-cyan-500/30"
                      disabled={activeImageIndex === galleryItems.length - 1}
                      aria-label="Próxima imagem"
                    >
                      <span className="text-lg">&#8594;</span>
                    </button>

                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
                      {galleryItems.map((_, index) => (
                        <span
                          key={index}
                          className={`h-1.5 w-6 rounded-full transition ${
                            index === activeImageIndex
                              ? "bg-cyan-300"
                              : "bg-cyan-500/20"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-cyan-100/70">
                Nenhuma imagem foi retornada pela simulação. Lance um novo plano para visualizar a galeria.
              </p>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-6 rounded-3xl border border-cyan-500/25 bg-slate-900/60 px-6 py-8 shadow-[0_0_60px_rgba(14,165,233,0.1)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Insights de relacionamento</h2>
              <p className="text-sm text-cyan-100/75">
                Destaques positivos e negativos entre os módulos selecionados durante a simulação.
              </p>
            </div>

            {hasRelationshipContent ? null : (
              <span className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
                Sem insights disponíveis
              </span>
            )}
          </div>

          {hasRelationshipContent ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-400/35 bg-emerald-950/30 p-5">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Pontos fortes</h3>
                  <span className="text-xs font-medium text-emerald-100/80">{improvementPoints.length}</span>
                </div>
                {improvementPoints.length ? (
                  <ul className="mt-4 space-y-3">
                    {improvementPoints.slice(0, 6).map((item, index) => (
                      <li
                        key={`${item.moduleType}-${item.withModuleType}-${index}`}
                        className="rounded-xl border border-emerald-400/25 bg-emerald-900/20 px-4 py-3"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                          {formatModuleType(item.moduleType)} + {formatModuleType(item.withModuleType)}
                        </p>
                        <p className="mt-2 text-xs text-emerald-50/80">{item.reason}</p>
                        <span className="mt-2 inline-flex rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-emerald-200">
                          +{item.points.toLocaleString("pt-BR")}
                          <span className="ml-1">pts</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-xs text-emerald-100/70">Nenhum destaque positivo registrado nesta execução.</p>
                )}
              </div>

              <div className="rounded-2xl border border-rose-400/35 bg-rose-950/30 p-5">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-300">Riscos</h3>
                  <span className="text-xs font-medium text-rose-100/80">{worsePoints.length}</span>
                </div>
                {worsePoints.length ? (
                  <ul className="mt-4 space-y-3">
                    {worsePoints.slice(0, 6).map((item, index) => (
                      <li
                        key={`${item.moduleType}-${item.withModuleType}-${index}`}
                        className="rounded-xl border border-rose-400/25 bg-rose-900/20 px-4 py-3"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-200">
                          {formatModuleType(item.moduleType)} + {formatModuleType(item.withModuleType)}
                        </p>
                        <p className="mt-2 text-xs text-rose-50/80">{item.reason}</p>
                        <span className="mt-2 inline-flex rounded-full bg-rose-500/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-rose-200">
                          {item.points.toLocaleString("pt-BR")}
                          <span className="ml-1">pts</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-xs text-rose-100/70">Nenhum ponto de atenção foi sinalizado.</p>
                )}
              </div>
            </div>
          ) : null}
        </section>

        <footer className="pb-8 text-center text-xs text-cyan-100/60">
          <p>
            Último relatório gerado em{" "}
            <span className="text-cyan-200/80">
              {playerLaunchStatus.lastUpdatedAt ? formatDateTime(playerLaunchStatus.lastUpdatedAt) : "--"}
            </span>
          </p>
        </footer>
      </div>
      {pdfHref && isPdfModalOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setPdfModalOpen(false)}
        >
          <div
            className="relative flex h-[90vh] w-[min(960px,95vw)] flex-col overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-900 shadow-[0_0_80px_rgba(14,165,233,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-end gap-3 border-b border-cyan-500/20 bg-slate-900/70 px-6 py-4">
              <a
                href={pdfHref}
                download={effectiveReport?.pdf?.fileName ?? makeReportFileName(missionConfig.name)}
                className="inline-flex items-center justify-center rounded-full border border-cyan-400/50 bg-transparent px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-100 transition hover:border-cyan-300 hover:text-cyan-50"
              >
                Baixar PDF
              </a>
              <button
                type="button"
                onClick={() => setPdfModalOpen(false)}
                className="rounded-full border border-cyan-400/50 bg-transparent px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-100 transition hover:border-cyan-300 hover:text-cyan-50"
              >
                Fechar
              </button>
            </div>
            <iframe
              src={pdfHref}
              title="Pré-visualização do relatório em PDF"
              className="h-full w-full flex-1 bg-slate-950"
            />
          </div>
        </div>
      ) : null}

      {isImageModalOpen && modalImage ? (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/95 backdrop-blur"
          role="dialog"
          aria-modal="true"
          onClick={() => setImageModalIndex(null)}
        >
          <div className="relative flex h-full w-full max-h-[95vh] max-w-5xl items-center justify-center p-6">
            <div className="relative h-full w-full overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-950/70 shadow-[0_0_80px_rgba(14,165,233,0.3)]">
              <Image
                src={modalImage.src}
                alt={modalImage.name}
                fill
                sizes="(max-width: 768px) 100vw, 900px"
                className="object-contain"
                unoptimized
              />
              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-center text-cyan-100">
                <span className="rounded-full border border-cyan-400/40 bg-slate-900/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]">
                  {modalImage.name}
                </span>
                {modalImage.isMock ? (
                  <span className="rounded-full border border-cyan-500/25 bg-cyan-500/15 px-3 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.35em] text-cyan-100/85">
                    Mock
                  </span>
                ) : null}
                <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">
                  Toque em qualquer lugar para fechar
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
