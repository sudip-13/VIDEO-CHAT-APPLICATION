"use client"

import { useEffect } from 'react';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SocketProvider } from '@/components/providers/socket';
import Authprovider from '@/components/Authprovider/Authprovider';
import { PeerProvider } from '@/components/providers/peer';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({children}){
  useEffect(() => {
    document.documentElement.lang = 'en';
  }, []);

  return (
    <html lang="en">
      <body className={inter.className}>
        <PeerProvider>
          <Authprovider>
            <SocketProvider>{children}</SocketProvider>
          </Authprovider>
        </PeerProvider>
      </body>
    </html>
  );
}
