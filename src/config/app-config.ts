import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Manta LFT.",
  version: packageJson.version,
  copyright: `© ${currentYear}, Manta.`,
  meta: {
    title: "Manta - Train For Life",
    description: "Inspired by the grace of the Manta Ray, Functional training to feel your best every day.",
  },
};
