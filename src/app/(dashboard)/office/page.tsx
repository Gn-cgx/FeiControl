import OfficeClient from './OfficeClient';

export const metadata = {
  title: '3D 办公室 | 任务控制中心',
  description: '实时查看你的 Agent 在 3D 环境中工作',
};

export default function OfficePage() {
  return <OfficeClient />;
}
