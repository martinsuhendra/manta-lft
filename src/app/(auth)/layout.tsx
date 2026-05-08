import { ReactNode } from "react";

import Image from "next/image";

import { MessageCircle } from "lucide-react";

import { APP_CONFIG } from "@/config/app-config";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main>
      <div className="bg-brand-accent grid h-dvh justify-center p-2 lg:grid-cols-2">
        <div className="relative order-2 hidden h-full flex-col items-center justify-center overflow-hidden rounded-3xl bg-slate-50 lg:flex">
          {/* Subtle animated background elements */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="bg-brand-accent/10 absolute top-0 right-0 left-0 -z-10 m-auto h-[310px] w-[310px] rounded-full opacity-40 blur-[100px]"></div>
          <div className="bg-brand-primary/15 absolute right-0 bottom-0 -z-10 h-[250px] w-[250px] rounded-full opacity-40 blur-[80px]"></div>

          <div className="z-10 flex flex-col items-center justify-center space-y-8 text-center">
            <div className="animate-bounce-slow relative flex items-center justify-center">
              <Image
                src="/primary-logo.svg"
                alt={`${APP_CONFIG.name} Logo`}
                width={180}
                height={180}
                className="h-auto w-auto drop-shadow-xl"
                priority
              />
            </div>
          </div>

          <div className="absolute right-10 bottom-10">
            <div
              className="animate-fade-in-up w-[320px] space-y-3 rounded-xl border border-slate-200/60 bg-white/70 p-4 text-slate-800 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-md"
              style={{ animationDelay: "300ms", animationFillMode: "both" }}
            >
              <h2 className="text-base font-semibold text-slate-900">Contact Support</h2>
              <p className="text-xs leading-relaxed text-slate-600">
                Need help setting things up? Reach me directly on WhatsApp.
              </p>
              <a
                href="https://wa.me/6287711281990"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-100"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                  <MessageCircle className="size-3.5" />
                </span>
                <span>Chat on WhatsApp</span>
                <span className="text-emerald-600/80 transition-transform duration-200 group-hover:translate-x-0.5">
                  +62 877-1128-1990
                </span>
              </a>
            </div>
          </div>
        </div>
        <div className="relative order-1 flex h-full">{children}</div>
      </div>
    </main>
  );
}
