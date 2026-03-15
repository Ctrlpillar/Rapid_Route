import { Link, useLocation } from "wouter";
import { Zap, Menu, X, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuth } from "@/contexts/auth-context";
import { SignInModal } from "@/components/sign-in-modal";

function cn(...inputs: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(inputs));
}

interface UserMenuProps {
  user: { initials: string; name: string; email: string };
  signOut: () => void;
}

function UserMenu({ user, signOut }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 border border-border hover:bg-slate-50 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center select-none">
          {user.initials}
        </div>
        <span className="text-sm font-medium text-foreground hidden sm:block max-w-[100px] truncate">{user.name.split(" ")[0]}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-border p-2 z-50">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-semibold text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <div className="h-px bg-border mx-1 mb-1" />
          <button
            onClick={() => { signOut(); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Track", href: "/track" },
    { name: "Account", href: "/settings" },
    { name: "Contacts", href: "/contacts" },
    { name: "Notifications", href: "/notifications" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-[1000] transition-all duration-300 border-b border-transparent",
        isScrolled ? "bg-white/80 backdrop-blur-lg border-border shadow-sm" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">
              Rapid<span className="text-primary">Route</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary relative py-2",
                  location === link.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {link.name}
                {location === link.href && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <UserMenu user={user} signOut={signOut} />
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="ghost" className="font-medium">Log in</Button>
                </Link>
                <Link href="/signin">
                  <Button className="rounded-full px-6 shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 hover:-translate-y-0.5 transition-all">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-background border-b border-border shadow-lg p-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "p-3 rounded-xl font-medium transition-colors",
                location === link.href ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <div className="h-px bg-border my-2" />
          {user ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-9 h-9 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">{user.initials}</div>
                <div>
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full justify-center text-red-500 border-red-200" onClick={() => { signOut(); setMobileMenuOpen(false); }}>
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </Button>
            </div>
          ) : (
            <>
              <Link href="/signin" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-center">Log in</Button>
              </Link>
              <Link href="/signin" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full justify-center">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-white border-t border-border py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-6 h-6 text-primary" />
          <span className="font-bold text-xl tracking-tight text-foreground">
            Rapid<span className="text-primary">Route</span>
          </span>
        </div>
        <p className="text-muted-foreground max-w-md mb-8">
          The smart way to track, manage, and secure your deliveries all in one place.
        </p>
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-sm font-medium text-foreground">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <Link href="/track" className="hover:text-primary transition-colors">Track</Link>
          <Link href="/settings" className="hover:text-primary transition-colors">Account</Link>
          <Link href="/contacts" className="hover:text-primary transition-colors">Contacts</Link>
          <Link href="/notifications" className="hover:text-primary transition-colors">Notifications</Link>
        </div>
        <div className="mt-12 pt-8 border-t border-border w-full flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} RapidRoute Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />
      <SignInModal />
      <main className="flex-1 flex flex-col w-full pt-20">
        {children}
      </main>
      <Footer />
    </div>
  );
}
