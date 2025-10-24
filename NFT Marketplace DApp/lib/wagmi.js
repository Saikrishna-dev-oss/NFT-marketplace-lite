import { localhost } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

export const config = getDefaultConfig({
  appName: process.env.NEXT_PUBLIC_APP_NAME || "NFT Marketplace DApp",
  projectId: projectId,
  chains: [localhost],
  ssr: true,
});
