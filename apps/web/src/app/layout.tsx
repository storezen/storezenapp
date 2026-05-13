import "./globals.css";
import "@/styles/design-system.css";
import { Poppins, Inter, Noto_Nastaliq_Urdu } from "next/font/google";
import { Providers } from "@/app/providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-poppins",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

const urdu = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-urdu",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${inter.variable} ${urdu.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
