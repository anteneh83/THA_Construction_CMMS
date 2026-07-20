import './globals.css';

export const metadata = {
  title: 'THA CMMS - Construction Machinery Management System',
  description: 'Enterprise machinery management and repair tracking platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
