import './globals.css';

export const metadata = {
  title: 'Find in the Home — Tìm Trong Nhà',
  description: 'Organize and find everything in your house. Sắp xếp và tìm mọi thứ trong ngôi nhà.',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
