import './globals.css';
import ClientNav from '../components/ClientNav';

export const metadata = {
  title: 'ReelVerse - 短剧付费解锁平台',
  description: 'Watch premium short dramas. Unlock full series with one payment.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body>
        <ClientNav />
        <main>{children}</main>
      </body>
    </html>
  );
}
