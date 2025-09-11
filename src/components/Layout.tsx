import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LogOut, User, Home, CreditCard, TrendingUp, Menu, Check, Mail } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useState, useEffect } from 'react';
import { Label } from '@radix-ui/react-dropdown-menu';
import { Textarea } from './ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const { theme } = useTheme();
  const [suggestion, setSuggestion] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSendSuggestion = async () => {
    if (!suggestion.trim()) {
      alert("Por favor, escreva uma sugestão antes de enviar.");
      return;
    }

    setIsSending(true);
    try {
      const session = await supabase.auth.getSession(); // pega sessão do usuário
      const token = session?.data?.session?.access_token;
      if (!token) {
        alert("Usuário não está logado");
        setIsSending(false);
        return;
      }

      const res = await fetch(
        "https://fqmdkeectrunuzeargxb.supabase.co/functions/v1/send-suggestion",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` // 🔹 envia token pro backend
          },
          body: JSON.stringify({ suggestion }),
        }
      );

      if (res.ok) {
        toast({
          title: 'Sucesso!',
          description: `Sugestão enviada com sucesso!`,
        });
      }

      if (!res.ok) {
        let errorMessage = "Erro ao enviar sugestão";
        try {
          const errorData = await res.json();
          if (errorData?.error) errorMessage = errorData.error;
        } catch {
          const textError = await res.text();
          if (textError) errorMessage = textError;
        }
        throw new Error(errorMessage);
      }

      setIsSuccess(true);
      setSuggestion("");
    } catch (err) {
      toast({
        title: 'Erro',
        description: err.message || "Erro ao enviar sugestão",
        variant: 'destructive',
      });
      // alert(err.message || "Erro ao enviar sugestão");
    } finally {
      setIsSending(false);
    }
  };


  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Não renderizar se não estiver autenticado
  if (!user) {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Contas', href: '/accounts', icon: CreditCard },
    { name: 'Transações', href: '/transactions', icon: TrendingUp },
    { name: 'Metas', href: '/goals', icon: TrendingUp },
    // { name: 'Criar Grupo', href: '/create-group', icon: Users },
    // { name: 'Membros', href: '/group-members', icon: Users },
    // { name: 'Convites', href: '/invitations', icon: Mail },
    { name: 'Perfil', href: '/profile', icon: User },
    { name: 'Contratar', href: '/subscribe', icon: Check },
  ];

  const MobileNavigationItem = ({ item, onClose }: { item: typeof navigation[0], onClose: () => void }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.href;

    return (
      <Link
        to={item.href}
        onClick={onClose}
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
      >
        <Icon size={20} />
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo e navegação desktop */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 h-10 overflow-hidden">
                <Link to="/" className="flex items-center space-x-2">
                  {theme === 'dark' ? (
                    <img
                      src="/escrito-branco.png"
                      alt="Logo Credari"
                      className="h-full w-32 object-cover"
                    />) : (
                    <img
                      src="/escrito-preto.png"
                      alt="Logo Credari"
                      className="h-full w-32 object-cover"
                    />
                  )}
                </Link>
              </div>


              {/* Navegação desktop */}
              <nav className="hidden lg:flex space-x-1">
                {/* remover o contratar dessa lista */}
                {navigation.filter((item) => item.name !== 'Contratar').map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                    >
                      <Icon size={16} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Menu mobile e user menu */}
            <div className="flex items-center space-x-2">
              <ThemeToggle />

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="p-2">
                    <Mail className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Enviar sugestão</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px]">
                  <div className="flex flex-col h-full">
                    <h2 className="text-lg font-semibold mb-4">Enviar sugestão</h2>
                    <div className="flex-1 space-y-4">
                      <Label htmlFor="suggestion">Sua sugestão</Label>
                      <Textarea
                        id="suggestion"
                        placeholder="Escreva aqui sua ideia ou sugestão..."
                        value={suggestion}
                        onChange={(e) => setSuggestion(e.target.value)}
                      />
                    </div>
                    <Button
                      className="mt-4"
                      disabled={isSending || !suggestion}
                      onClick={handleSendSuggestion}
                    >
                      {isSending ? "Enviando..." : "Enviar"}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Menu mobile */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="lg:hidden p-2">
                    <Menu size={20} />
                    <span className="sr-only">Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                  <div className="flex flex-col h-full">
                    {/* Header do menu mobile */}
                    <div className="flex items-center justify-between pb-4 border-b">
                      <h2 className="text-lg font-semibold">Menu</h2>
                      {/* <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2"
                      >
                        <X size={18} />
                      </Button> */}
                    </div>

                    {/* Informações do usuário */}
                    <div className="flex items-center space-x-3 py-4 border-b">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {user?.user_metadata?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1">
                        <p className="font-medium text-sm">{user?.user_metadata?.display_name || 'Usuário'}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    {/* Navegação mobile */}
                    <nav className="flex flex-col space-y-2 py-4 flex-1">
                      {navigation.map((item) => (
                        <MobileNavigationItem
                          key={item.name}
                          item={item}
                          onClose={() => setIsMobileMenuOpen(false)}
                        />
                      ))}
                    </nav>

                    {/* Logout */}
                    <div className="border-t pt-4">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          signOut();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full justify-start text-muted-foreground hover:text-foreground"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        Sair
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* User dropdown desktop */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full hidden lg:flex">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user?.user_metadata?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user?.user_metadata?.display_name || 'Usuário'}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-2">
                    {navigation
                      .filter((item) => item.name === 'Perfil' || item.name === 'Contratar')
                      .map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={`flex items-center space-x-2 px-2 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                              }`}
                          >
                            <Icon size={16} />
                            <span>{item.name}</span>
                          </Link>
                        );
                      })}
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        {children}
      </main>
    </div>
  );
}