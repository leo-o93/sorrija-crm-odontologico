import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDREReport, useProcedureRanking, useCategoryBreakdown, useComparativeReport } from '@/hooks/useFinancialReports';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', '#8884d8', '#82ca9d', '#ffc658'];

export function FinancialReports() {
  const [period, setPeriod] = useState('current');
  
  const getPeriodDates = () => {
    const now = new Date();
    switch (period) {
      case 'previous':
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case 'quarter':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case 'semester':
        return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
      case 'year':
        return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const { start, end } = getPeriodDates();
  const { data: dreData, isLoading: dreLoading } = useDREReport(start, end);
  const { data: procedureData, isLoading: procedureLoading } = useProcedureRanking(start, end);
  const { data: categoryData, isLoading: categoryLoading } = useCategoryBreakdown(start, end, 'despesa');
  const { data: comparativeData, isLoading: comparativeLoading } = useComparativeReport();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const VariationBadge = ({ value }: { value: number }) => {
    if (value > 0) {
      return (
        <Badge variant="default" className="bg-emerald-500">
          <ArrowUpRight className="h-3 w-3 mr-1" />
          {formatPercent(value)}
        </Badge>
      );
    } else if (value < 0) {
      return (
        <Badge variant="destructive">
          <ArrowDownRight className="h-3 w-3 mr-1" />
          {formatPercent(value)}
        </Badge>
      );
    }
    return <Badge variant="secondary">0%</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Relatórios Financeiros</h3>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Mês Atual</SelectItem>
            <SelectItem value="previous">Mês Anterior</SelectItem>
            <SelectItem value="quarter">Último Trimestre</SelectItem>
            <SelectItem value="semester">Último Semestre</SelectItem>
            <SelectItem value="year">Ano Atual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="dre" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dre">DRE Simplificado</TabsTrigger>
          <TabsTrigger value="procedures">Por Procedimento</TabsTrigger>
          <TabsTrigger value="categories">Por Categoria</TabsTrigger>
          <TabsTrigger value="comparative">Comparativo</TabsTrigger>
        </TabsList>

        {/* DRE Simplificado */}
        <TabsContent value="dre">
          {dreLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Cards de Resumo */}
              <Card className="md:col-span-2">
                <CardContent className="pt-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                      <p className="text-sm text-muted-foreground">Receitas</p>
                      <p className="text-2xl font-bold text-emerald-600">{formatCurrency(dreData?.totalRevenue || 0)}</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                      <p className="text-sm text-muted-foreground">Despesas</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(dreData?.totalExpenses || 0)}</p>
                    </div>
                    <div className={`text-center p-4 rounded-lg ${(dreData?.netResult || 0) >= 0 ? 'bg-blue-50 dark:bg-blue-950' : 'bg-orange-50 dark:bg-orange-950'}`}>
                      <p className="text-sm text-muted-foreground">Resultado</p>
                      <p className={`text-2xl font-bold ${(dreData?.netResult || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {formatCurrency(dreData?.netResult || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico de Barras */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Receitas vs Despesas por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      ...(dreData?.revenues || []).map(r => ({ name: r.category, receita: r.amount, despesa: 0 })),
                      ...(dreData?.expenses || []).map(e => ({ name: e.category, receita: 0, despesa: e.amount })),
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                      <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="receita" fill="hsl(var(--chart-2))" name="Receita" />
                      <Bar dataKey="despesa" fill="hsl(var(--destructive))" name="Despesa" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Tabela de Receitas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-emerald-600">Receitas</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(dreData?.revenues || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground">
                            Nenhuma receita no período
                          </TableCell>
                        </TableRow>
                      ) : (
                        dreData?.revenues.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.category}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                          </TableRow>
                        ))
                      )}
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">{formatCurrency(dreData?.totalRevenue || 0)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Tabela de Despesas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Despesas</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(dreData?.expenses || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground">
                            Nenhuma despesa no período
                          </TableCell>
                        </TableRow>
                      ) : (
                        dreData?.expenses.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.category}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                          </TableRow>
                        ))
                      )}
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">{formatCurrency(dreData?.totalExpenses || 0)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Ranking por Procedimento */}
        <TabsContent value="procedures">
          {procedureLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Ranking de Procedimentos por Faturamento</CardTitle>
              </CardHeader>
              <CardContent>
                {(procedureData || []).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum procedimento encontrado no período
                  </p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={procedureData?.slice(0, 10)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                        <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Faturamento" />
                      </BarChart>
                    </ResponsiveContainer>

                    <Table className="mt-6">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Procedimento</TableHead>
                          <TableHead className="text-right">Quantidade</TableHead>
                          <TableHead className="text-right">Faturamento</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {procedureData?.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Badge variant={index < 3 ? 'default' : 'secondary'}>
                                {index + 1}º
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-right">{item.count}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(item.revenue)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Despesas por Categoria */}
        <TabsContent value="categories">
          {categoryLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Despesas</CardTitle>
                </CardHeader>
                <CardContent>
                  {(categoryData || []).length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma despesa encontrada no período
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name}: ${percentage.toFixed(0)}%`}
                          outerRadius={100}
                          dataKey="amount"
                          nameKey="name"
                        >
                          {categoryData?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detalhamento por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(categoryData || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            Nenhuma categoria encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        categoryData?.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }} 
                                />
                                {item.name}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                            <TableCell className="text-right">{item.percentage.toFixed(1)}%</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Comparativo */}
        <TabsContent value="comparative">
          {comparativeLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Comparativo Mensal */}
              <Card>
                <CardHeader>
                  <CardTitle>Comparativo Mensal</CardTitle>
                  <p className="text-sm text-muted-foreground">Mês atual vs. mês anterior</p>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead></TableHead>
                        <TableHead className="text-right">Mês Atual</TableHead>
                        <TableHead className="text-right">Mês Anterior</TableHead>
                        <TableHead className="text-right">Variação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Receitas</TableCell>
                        <TableCell className="text-right">{formatCurrency(comparativeData?.currentMonth.revenue || 0)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(comparativeData?.previousMonth.revenue || 0)}</TableCell>
                        <TableCell className="text-right">
                          <VariationBadge value={comparativeData?.monthVariation.revenue || 0} />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Despesas</TableCell>
                        <TableCell className="text-right">{formatCurrency(comparativeData?.currentMonth.expenses || 0)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(comparativeData?.previousMonth.expenses || 0)}</TableCell>
                        <TableCell className="text-right">
                          <VariationBadge value={-(comparativeData?.monthVariation.expenses || 0)} />
                        </TableCell>
                      </TableRow>
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell>Resultado</TableCell>
                        <TableCell className="text-right">{formatCurrency(comparativeData?.currentMonth.result || 0)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(comparativeData?.previousMonth.result || 0)}</TableCell>
                        <TableCell className="text-right">
                          <VariationBadge value={comparativeData?.monthVariation.result || 0} />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Comparativo Anual */}
              <Card>
                <CardHeader>
                  <CardTitle>Comparativo Anual</CardTitle>
                  <p className="text-sm text-muted-foreground">Ano atual vs. ano anterior</p>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead></TableHead>
                        <TableHead className="text-right">Ano Atual</TableHead>
                        <TableHead className="text-right">Ano Anterior</TableHead>
                        <TableHead className="text-right">Variação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Receitas</TableCell>
                        <TableCell className="text-right">{formatCurrency(comparativeData?.currentYear.revenue || 0)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(comparativeData?.previousYear.revenue || 0)}</TableCell>
                        <TableCell className="text-right">
                          <VariationBadge value={comparativeData?.yearVariation.revenue || 0} />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Despesas</TableCell>
                        <TableCell className="text-right">{formatCurrency(comparativeData?.currentYear.expenses || 0)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(comparativeData?.previousYear.expenses || 0)}</TableCell>
                        <TableCell className="text-right">
                          <VariationBadge value={-(comparativeData?.yearVariation.expenses || 0)} />
                        </TableCell>
                      </TableRow>
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell>Resultado</TableCell>
                        <TableCell className="text-right">{formatCurrency(comparativeData?.currentYear.result || 0)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(comparativeData?.previousYear.result || 0)}</TableCell>
                        <TableCell className="text-right">
                          <VariationBadge value={comparativeData?.yearVariation.result || 0} />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
