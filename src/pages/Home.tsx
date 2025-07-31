import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { DollarSign, TrendingUp, Shield, BarChart3, ArrowRight, CheckCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Credari</span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link to="/auth">
              <Button variant="outline">Login</Button>
            </Link>
            <Link to="/auth">
              <Button>Criar Conta</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Controle Total das Suas Finanças
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Gerencie suas contas, acompanhe transações e tenha insights completos sobre sua vida financeira 
            em uma plataforma moderna e segura.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto">
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Ver Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Recursos Principais</h2>
            <p className="text-lg text-muted-foreground">
              Tudo que você precisa para gerenciar suas finanças de forma eficiente
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <DollarSign className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Gestão de Contas</CardTitle>
                <CardDescription>
                  Organize todas suas contas bancárias em um só lugar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    Múltiplas contas
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    Saldos em tempo real
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    Histórico completo
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Controle de Transações</CardTitle>
                <CardDescription>
                  Registre e categorize todas suas movimentações financeiras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    Receitas e despesas
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    Categorização automática
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    Filtros avançados
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Relatórios e Insights</CardTitle>
                <CardDescription>
                  Visualize seus dados financeiros com gráficos intuitivos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    Dashboard personalizado
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    Gráficos interativos
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    Análise de tendências
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-2xl mx-auto">
            <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Seguro e Confiável</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Seus dados estão protegidos com as melhores práticas de segurança. 
              Comece a usar agora mesmo e tenha controle total das suas finanças.
            </p>
            <Link to="/auth">
              <Button size="lg">
                Criar Minha Conta Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <DollarSign className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Credari</span>
          </div>
          <p className="text-muted-foreground">
            © 2024 Credari. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;