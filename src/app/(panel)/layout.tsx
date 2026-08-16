import PanelShell from "@/components/PanelShell";

export default function PanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <PanelShell>{children}</PanelShell>;
}
