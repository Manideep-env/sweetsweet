import ConditionalNavbar from "@/components/ConditionalNavbar";

export default function MainLayout({ children }) {
  // This layout will have the navbar and apply to all pages inside the (main) group.
  return (
    <>
      <ConditionalNavbar />
      <main>{children}</main>
    </>
  );
}
