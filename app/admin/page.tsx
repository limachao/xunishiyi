import { getDashboardStats } from '@/app/actions/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  const statCards = [
    {
      title: '用户总数',
      value: stats.totalUsers,
      sub: `最近 7 天新增 ${stats.recentUsers} 人`,
      color: 'from-[oklch(0.62_0.11_195)]/20 to-[oklch(0.62_0.11_195)]/5',
    },
    {
      title: '生成记录总数',
      value: stats.totalOrders,
      sub: `最近 7 天新增 ${stats.recentOrders} 条`,
      color: 'from-[oklch(0.5_0.11_175)]/20 to-[oklch(0.5_0.11_175)]/5',
    },
    {
      title: '总消耗积分',
      value: stats.totalCreditsConsumed,
      sub: `最近 7 天消耗 ${stats.recentCreditsConsumed}`,
      color: 'from-[oklch(0.55_0.15_195)]/20 to-[oklch(0.55_0.15_195)]/5',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">概览</h1>
        <p className="text-white/50 mt-1">查看系统运营数据总览</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <Card key={card.title} className="overflow-hidden">
            <CardHeader className={`bg-gradient-to-br ${card.color}`}>
              <CardTitle className="text-sm font-medium text-white/70">{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-white">{card.value.toLocaleString()}</div>
              <p className="text-sm text-white/50 mt-2">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">数据说明</h2>
        <ul className="space-y-2 text-sm text-white/60">
          <li>• 用户总数：数据库中注册用户的总数量</li>
          <li>• 生成记录总数：所有 AI 虚拟试衣生成记录的总条数</li>
          <li>• 总消耗积分：所有成功生成所消耗的积分总量</li>
          <li>• 最近 7 天数据：基于 created_at 字段计算最近 7 天的新增/消耗</li>
        </ul>
      </div>
    </div>
  );
}
