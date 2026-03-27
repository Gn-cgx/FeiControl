// Amazon SDE Intern 入职学习 Plan - 数据
// Source: amazon-prep-site/index.html

export interface StudyItem {
  text: string; // plain text (HTML tags stripped)
  sub?: string;
}

export interface StudySection {
  icon: string;
  title: string;
  exercise?: boolean;
  output?: string;
  items: StudyItem[];
}

export interface StudyDay {
  day: number;
  date: string; // e.g. "3/25"
  weekday: string;
  title: string;
  rest?: boolean;
  sections?: StudySection[];
}

export interface StudyWeek {
  id: number;
  title: string;
  dates: string;
  theme: string;
  goal: string;
  deliverable: string;
}

// Day number → ISO date mapping
export const dayDateMap: Record<number, string> = {
  1: "2026-03-25", 2: "2026-03-26", 3: "2026-03-27", 4: "2026-03-28", 5: "2026-03-29",
  6: "2026-03-30", 7: "2026-03-31", 8: "2026-04-01", 9: "2026-04-02", 10: "2026-04-03",
  11: "2026-04-04", 12: "2026-04-05", 13: "2026-04-06", 14: "2026-04-07", 15: "2026-04-08",
  16: "2026-04-09", 17: "2026-04-10", 18: "2026-04-11", 19: "2026-04-13", 20: "2026-04-14",
  21: "2026-04-15", 22: "2026-04-16", 23: "2026-04-17", 24: "2026-04-18", 25: "2026-04-20",
  26: "2026-04-21", 27: "2026-04-22", 28: "2026-04-23", 29: "2026-04-24", 30: "2026-04-25",
  31: "2026-04-27", 32: "2026-04-28", 33: "2026-04-29", 34: "2026-04-30", 35: "2026-05-01",
};

// Reverse: ISO date → day number
export const dateToDay: Record<string, number> = Object.fromEntries(
  Object.entries(dayDateMap).map(([day, date]) => [date, Number(day)])
);

export const studyWeeks: StudyWeek[] = [
  { id: 1, title: "AWS 入门 + Lambda 🌱", dates: "3/25-3/30", theme: "AWS 基础 + Serverless", goal: "理解 AWS 基础概念，成功部署第一个 Lambda 函数", deliverable: "一个能返回 JSON 的 Lambda 函数 + API Gateway 端点" },
  { id: 2, title: "DynamoDB + API 实战 🔧", dates: "3/31-4/5", theme: "数据库 + REST API", goal: "掌握 DynamoDB 基本操作，构建完整的 Task Manager REST API", deliverable: "完整的 Task Manager API（Lambda + DynamoDB + API Gateway）" },
  { id: 3, title: "基础设施即代码 ⚡", dates: "4/6-4/11", theme: "AWS CDK (Java)", goal: "用 AWS CDK (Java) 把 Week 1-2 的手动操作全部代码化", deliverable: "一个 cdk deploy 就能部署完整 Task Manager 的 CDK 项目" },
  { id: 4, title: "综合实战 🎯", dates: "4/13-4/18", theme: "完整 Serverless 应用", goal: "构建一个有真实使用价值的 Serverless 应用", deliverable: "「智能书签管理器」— 收藏链接 + 自动分类 + 搜索" },
  { id: 5, title: "Amazon 工程文化 📦", dates: "4/20-4/25", theme: "软技能 + 工作方式", goal: "了解 Amazon 的工作方式，学会用「Amazon 人」的方式沟通和写文档", deliverable: "一份模拟 Design Doc + 一次模拟 Code Review" },
  { id: 6, title: "终极冲刺 🎓", dates: "4/27-5/3", theme: "复盘 + 心理准备", goal: "全面复盘 + 心理准备 + Day 1 就绪", deliverable: "个人技术 Portfolio + 入职 Checklist" },
];

// All study days with their tasks
export const studyDays: StudyDay[] = [
  // Week 1
  {
    day: 1, date: "3/25", weekday: "周三", title: "认识 AWS",
    sections: [
      { icon: "📖", title: "学习内容（45min）", items: [
        { text: "看 B站 AWS 基础教程 第1-4集", sub: "了解 EC2、S3、IAM 的基本概念" },
        { text: "读 AWS 云计算简介", sub: "理解云计算 vs 传统部署" },
      ]},
      { icon: "🔨", title: "动手实操（30min）", items: [
        { text: "注册/登录 AWS 免费账号" },
        { text: "逛 AWS Console 首页，点击 5 个不同服务看看界面" },
        { text: "找到 IAM → 看看你账号有哪些权限" },
      ]},
      { icon: "🏋️", title: "今日一练（15min）", exercise: true, items: [
        { text: "用自己的话回答：EC2、S3、Lambda 分别是什么？（3 句话）" },
      ], output: "✅ 产出：3 句话总结" },
    ]
  },
  {
    day: 2, date: "3/26", weekday: "周四", title: "Lambda 是什么 + 第一个函数",
    sections: [
      { icon: "📖", title: "学习内容（30min）", items: [
        { text: "读 Lambda 开发者指南 - Lambda 简介", sub: "理解 Event-Driven + 无服务器" },
        { text: "看 B站 快速上手 AWS Lambda 前 15 分钟" },
      ]},
      { icon: "🔨", title: "动手实操（60min）", items: [
        { text: "AWS Console → Lambda → 创建函数" },
        { text: "选 Java 21 (Corretto) 运行时" },
        { text: "写 Hello World Handler：接收 event，返回 JSON" },
        { text: "用 Test 功能测试，看 CloudWatch Logs" },
      ]},
      { icon: "🏋️", title: "今日一练（15min）", exercise: true, items: [
        { text: "修改 Lambda：接收 name 参数，返回 \"你好, [name]!\"" },
      ], output: "✅ 产出：Lambda 截图" },
    ]
  },
  {
    day: 3, date: "3/27", weekday: "周五", title: "API Gateway + Lambda 联动",
    sections: [
      { icon: "📖", title: "学习内容（20min）", items: [
        { text: "读 API Gateway 开发者指南 - REST API", sub: "API Gateway 是 Lambda 的「门」" },
      ]},
      { icon: "🔨", title: "动手实操（90min）", items: [
        { text: "创建 REST API → 创建资源 /hello" },
        { text: "创建 GET 方法 → 连接 Lambda" },
        { text: "部署 API → 用浏览器访问" },
        { text: "用 curl 测试 API 端点" },
      ]},
      { icon: "🏋️", title: "今日一练（15min）", exercise: true, items: [
        { text: "加一个 POST /hello 端点，接收 JSON body 并返回" },
      ], output: "✅ 产出：curl 测试截图" },
    ]
  },
  {
    day: 4, date: "3/28", weekday: "周六", title: "Java Lambda 本地开发",
    sections: [
      { icon: "📖", title: "学习内容（20min）", items: [
        { text: "读 Lambda Java 部署包文档", sub: "了解 Maven + uber-jar 打包" },
      ]},
      { icon: "🔨", title: "动手实操（90min）", items: [
        { text: "本地创建 Maven 项目" },
        { text: "添加 aws-lambda-java-core 依赖" },
        { text: "写 Handler 类，mvn package" },
        { text: "上传 jar 到 Lambda 控制台测试" },
      ]},
      { icon: "🏋️", title: "今日一练（20min）", exercise: true, items: [
        { text: "修改 Handler：解析 queryStringParameters，返回不同问候语" },
      ], output: "✅ 产出：本地构建 + 测试通过" },
    ]
  },
  {
    day: 5, date: "3/29", weekday: "周日", title: "复习 + 周小结",
    sections: [
      { icon: "📝", title: "复习（1h）", items: [
        { text: "回顾 Day 1-4 笔记" },
        { text: "确保 Lambda + API Gateway 端点还能正常工作" },
        { text: "写本周学习小结（学到了什么、还有什么不懂）" },
      ]},
    ]
  },
  { day: 6, date: "3/30", weekday: "周一", rest: true, title: "休息日 🎉" },
  // Week 2
  {
    day: 7, date: "3/31", weekday: "周二", title: "DynamoDB 概念",
    sections: [
      { icon: "📖", title: "学习内容（40min）", items: [
        { text: "看 B站 AWS DynamoDB 实践 前 20 分钟" },
        { text: "读 DynamoDB 开发者指南 - 核心概念", sub: "Table / Item / Primary Key / Partition Key" },
      ]},
      { icon: "🔨", title: "动手实操（60min）", items: [
        { text: "Console 创建 Tasks 表 (PK=taskId, String)" },
        { text: "手动插入 3 条测试数据" },
        { text: "体验 Scan 和 Query 的区别" },
      ]},
      { icon: "🏋️", title: "今日一练（15min）", exercise: true, items: [
        { text: "回答：什么时候用 Query，什么时候用 Scan？" },
      ], output: "✅ 产出：一句话回答" },
    ]
  },
  {
    day: 8, date: "4/1", weekday: "周三", title: "Java + DynamoDB 编程",
    sections: [
      { icon: "📖", title: "学习内容（20min）", items: [
        { text: "读 AWS SDK for Java 2.x - DynamoDB Enhanced Client 文档" },
      ]},
      { icon: "🔨", title: "动手实操（90min）", items: [
        { text: "添加依赖 dynamodb-enhanced" },
        { text: "写 Task Bean 类 + TaskDao 类" },
        { text: "实现 CRUD：create/get/getAll/updateStatus/delete" },
        { text: "本地测试每个方法" },
      ]},
      { icon: "🏋️", title: "今日一练（20min）", exercise: true, items: [
        { text: "加 priority 字段，写方法只返回 HIGH 优先级任务（scan + filterExpression）" },
      ], output: "✅ 产出：TaskDao 代码 + 测试输出" },
    ]
  },
  {
    day: 9, date: "4/2", weekday: "周四", title: "Lambda + DynamoDB 联动",
    sections: [
      { icon: "📖", title: "学习内容（15min）", items: [
        { text: "读 Lambda 执行角色文档", sub: "Lambda 访问 DynamoDB 需要 IAM 权限" },
      ]},
      { icon: "🔨", title: "动手实操（90min）", items: [
        { text: "给 Lambda 执行角色添加 AmazonDynamoDBFullAccess" },
        { text: "创建 TaskHandler Lambda" },
        { text: "实现 POST/GET 路由，连接 DynamoDB" },
        { text: "CloudWatch Logs 验证无权限错误" },
      ]},
      { icon: "🏋️", title: "今日一练（15min）", exercise: true, items: [
        { text: "故意去掉 DynamoDB 权限，观察错误日志，加回权限对比" },
      ], output: "✅ 产出：两张 CloudWatch 日志截图" },
    ]
  },
  {
    day: 10, date: "4/3", weekday: "周五", title: "完整 REST API 组装",
    sections: [
      { icon: "🔨", title: "动手实操（2-3h）", items: [
        { text: "API Gateway 创建 POST/GET/PUT/DELETE 全套端点" },
        { text: "每个端点用 curl 测试通过" },
        { text: "处理错误：404 任务不存在、400 参数缺失" },
      ]},
      { icon: "🏋️", title: "今日一练（20min）", exercise: true, items: [
        { text: "创建 5 个任务，更新 2 个为 done，删除 1 个，写 bash 脚本自动化" },
      ], output: "✅ 产出：test.sh 脚本 + 运行结果" },
    ]
  },
  { day: 11, date: "4/4", weekday: "周六", rest: true, title: "休息日 🎉" },
  { day: 12, date: "4/5", weekday: "周日", rest: true, title: "休息日 🎉" },
  // Week 3
  {
    day: 13, date: "4/6", weekday: "周一", title: "CDK 概念 + 环境搭建",
    sections: [
      { icon: "📖", title: "学习内容（30min）", items: [
        { text: "读 什么是 AWS CDK（中文）", sub: "App → Stack → Construct 三层抽象" },
      ]},
      { icon: "🔨", title: "动手实操（90min）", items: [
        { text: "安装 CDK CLI：npm install -g aws-cdk" },
        { text: "初始化 Java CDK 项目：cdk init app --language java" },
        { text: "理解目录结构：App / Stack / cdk.json" },
        { text: "运行 cdk synth + cdk bootstrap" },
      ]},
      { icon: "🏋️", title: "今日一练（15min）", exercise: true, items: [
        { text: "在 Stack 里加 S3 Bucket → cdk diff → cdk deploy → 确认 → cdk destroy" },
      ], output: "✅ 产出：cdk diff 输出截图" },
    ]
  },
  {
    day: 14, date: "4/7", weekday: "周二", title: "CDK 定义 Lambda + DynamoDB",
    sections: [
      { icon: "📖", title: "学习内容（20min）", items: [
        { text: "做 CDK Workshop - Java 到 Hello Lambda" },
      ]},
      { icon: "🔨", title: "动手实操（90min）", items: [
        { text: "CDK 定义 DynamoDB Table（PAY_PER_REQUEST）" },
        { text: "CDK 定义 Lambda Function（Java 21, 512MB）" },
        { text: "tasksTable.grantReadWriteData(taskHandler)" },
        { text: "cdk synth + cdk deploy" },
      ]},
      { icon: "🏋️", title: "今日一练（20min）", exercise: true, items: [
        { text: "看 CloudFormation YAML，分析 grantReadWriteData 生成的 IAM Policy" },
      ], output: "✅ 产出：3-5 句话安全分析" },
    ]
  },
  {
    day: 15, date: "4/8", weekday: "周三", title: "CDK 定义 API Gateway",
    sections: [
      { icon: "📖", title: "学习内容（15min）", items: [
        { text: "读 CDK Construct 文档", sub: "L1/L2/L3 Construct 的区别" },
      ]},
      { icon: "🔨", title: "动手实操（90min）", items: [
        { text: "CDK 定义 REST API + LambdaIntegration" },
        { text: "添加 /tasks 资源和所有方法" },
        { text: "CfnOutput 输出 API URL" },
        { text: "cdk deploy，curl 测试全部端点" },
      ]},
      { icon: "🏋️", title: "今日一练（15min）", exercise: true, items: [
        { text: "cdk destroy + cdk deploy 重建，记录耗时" },
      ], output: "✅ 产出：部署时间记录" },
    ]
  },
  {
    day: 16, date: "4/9", weekday: "周四", title: "CDK 测试 + 最佳实践",
    sections: [
      { icon: "📖", title: "学习内容（30min）", items: [
        { text: "读 CDK 最佳实践文档", sub: "Stack 拆分、context 参数、Tags" },
      ]},
      { icon: "🔨", title: "动手实操（90min）", items: [
        { text: "添加 CDK 单元测试（Template.fromStack）" },
        { text: "添加 dev/prod 环境区分" },
        { text: "给所有资源添加标签" },
      ]},
      { icon: "🏋️", title: "今日一练（20min）", exercise: true, items: [
        { text: "故意制造错误，看 cdk synth 报错，学会定位问题" },
      ], output: "✅ 产出：错误信息截图 + 修复过程" },
    ]
  },
  {
    day: 17, date: "4/10", weekday: "周五", title: "完整 CDK 项目打包",
    sections: [
      { icon: "🔨", title: "项目完善（2-3h）", items: [
        { text: "整理项目结构：lambda/ + CDK src/ + test/" },
        { text: "写 deploy.sh 一键部署脚本" },
        { text: "完善 README.md：架构图、部署步骤、API 文档" },
      ]},
    ]
  },
  { day: 18, date: "4/11", weekday: "周六", rest: true, title: "休息日 🎉" },
  // Week 4
  {
    day: 19, date: "4/13", weekday: "周一", title: "设计阶段",
    sections: [
      { icon: "📖", title: "学习 + 思考（1h）", items: [
        { text: "先不写代码！写一个 1 页 Design Doc" },
        { text: "设计 DynamoDB 表（PK: userId, SK: bookmarkId, GSI: tagIndex）" },
        { text: "设计 API 端点：POST/GET/DELETE /bookmarks" },
      ]},
      { icon: "🔨", title: "动手搭建（1.5h）", items: [
        { text: "创建 CDK 项目骨架" },
        { text: "定义 DynamoDB 表（带 GSI）" },
        { text: "定义 Lambda + API Gateway" },
        { text: "cdk deploy 验证基础设施" },
      ]},
      { icon: "🏋️", title: "今日一练（15min）", exercise: true, items: [
        { text: "用自己的话解释 GSI（3 句话）" },
      ], output: "✅ 产出：Design Doc + GSI 解释" },
    ]
  },
  {
    day: 20, date: "4/14", weekday: "周二", title: "核心 CRUD 实现",
    sections: [
      { icon: "🔨", title: "全天实操（2.5h）", items: [
        { text: "实现 BookmarkHandler Lambda" },
        { text: "POST：解析 JSON，生成 UUID，写入 DynamoDB" },
        { text: "GET：查询所有书签 / 通过 GSI 按 tag 查询" },
        { text: "DELETE：删除指定书签" },
        { text: "错误处理：缺字段 400、不存在 404" },
      ]},
      { icon: "🏋️", title: "今日一练（20min）", exercise: true, items: [
        { text: "写 URL 格式校验方法，无效 URL 返回 400 Bad Request" },
      ], output: "✅ 产出：校验方法代码" },
    ]
  },
  {
    day: 21, date: "4/15", weekday: "周三", title: "搜索 + 分页 + 优化",
    sections: [
      { icon: "📖", title: "学习内容（20min）", items: [
        { text: "读 DynamoDB 分页查询文档", sub: "LastEvaluatedKey + ExclusiveStartKey" },
      ]},
      { icon: "🔨", title: "动手实操（2h）", items: [
        { text: "实现分页：GET /bookmarks?limit=10&nextToken=xxx" },
        { text: "实现模糊搜索：GET /bookmarks?q=java" },
        { text: "Lambda 性能优化：DynamoDB 客户端放 handler 外 + SnapStart" },
      ]},
      { icon: "🏋️", title: "今日一练（15min）", exercise: true, items: [
        { text: "插入 25 条数据，用 limit=10 分三页取完" },
      ], output: "✅ 产出：三次 curl 请求和结果" },
    ]
  },
  {
    day: 22, date: "4/16", weekday: "周四", title: "监控 + 日志 + 错误处理",
    sections: [
      { icon: "📖", title: "学习内容（30min）", items: [
        { text: "读 CloudWatch Logs 文档", sub: "日志级别、Metrics：Duration/Errors/Throttles" },
      ]},
      { icon: "🔨", title: "动手实操（90min）", items: [
        { text: "添加结构化日志" },
        { text: "CDK 添加 CloudWatch Alarm" },
        { text: "故意制造错误，查看告警" },
        { text: "添加全局错误处理" },
      ]},
      { icon: "🏋️", title: "今日一练（20min）", exercise: true, items: [
        { text: "CloudWatch Logs Insights 查询 ERROR 日志" },
      ], output: "✅ 产出：查询结果截图" },
    ]
  },
  {
    day: 23, date: "4/17", weekday: "周五", title: "项目收尾 + 文档",
    sections: [
      { icon: "🔨", title: "最终打磨（2-3h）", items: [
        { text: "完善错误处理和边界情况" },
        { text: "写完整 README.md（架构图、部署、API 文档）" },
        { text: "cdk destroy + cdk deploy 完整验证" },
        { text: "（可选）推到 GitHub 私人仓库" },
      ]},
    ]
  },
  { day: 24, date: "4/18", weekday: "周六", rest: true, title: "休息日 🎉" },
  // Week 5
  {
    day: 25, date: "4/20", weekday: "周一", title: "Amazon Leadership Principles",
    sections: [
      { icon: "📖", title: "精读（1h）", items: [
        { text: "读 Leadership Principles 中文版（全部 16 条）" },
        { text: "重点 5 条：Customer Obsession、Ownership、Bias for Action、Dive Deep、Deliver Results" },
      ]},
      { icon: "🔨", title: "实践（1h）", items: [
        { text: "用书签项目写 5 个 LP 相关案例" },
      ]},
      { icon: "🏋️", title: "今日一练（15min）", exercise: true, items: [
        { text: "挑 3 条最有共鸣的 LP，一句话总结理解" },
      ], output: "✅ 产出：3 条 LP + 你的一句话理解" },
    ]
  },
  {
    day: 26, date: "4/21", weekday: "周二", title: "Design Doc 怎么写",
    sections: [
      { icon: "📖", title: "学习内容（40min）", items: [
        { text: "了解 Amazon 6-pager / 1-pager 文化", sub: "结构：Problem → Tenets → Solution → Alternatives → Risks" },
      ]},
      { icon: "🔨", title: "写 Design Doc（1.5h）", items: [
        { text: "假设需求：「为团队内部工具添加通知功能」" },
        { text: "写 1-pager：Problem Statement、Tenets、Solution、Alternatives、Risks、Timeline" },
      ]},
      { icon: "🏋️", title: "今日一练（20min）", exercise: true, items: [
        { text: "找一个之前的项目/作业，用 1-pager 格式重新组织" },
      ], output: "✅ 产出：1-pager Design Doc" },
    ]
  },
  {
    day: 27, date: "4/22", weekday: "周三", title: "Code Review 文化",
    sections: [
      { icon: "📖", title: "学习内容（30min）", items: [
        { text: "CR 评语类型：nit: / optional: / blocking:" },
        { text: "写好 CR 描述 + 回复评论的方法" },
      ]},
      { icon: "🔨", title: "实践（1.5h）", items: [
        { text: "以 reviewer 视角审查自己的书签项目代码" },
        { text: "给自己写 5+ 条 CR 评论" },
        { text: "修复发现的问题" },
      ]},
      { icon: "🏋️", title: "今日一练（15min）", exercise: true, items: [
        { text: "写 3 条高质量 CR 评论（问题 + 原因 + 建议修改）" },
      ], output: "✅ 产出：3 条 CR 评论" },
    ]
  },
  {
    day: 28, date: "4/23", weekday: "周四", title: "Oncall + 运维意识",
    sections: [
      { icon: "📖", title: "学习内容（30min）", items: [
        { text: "Amazon Oncall 文化：You build it, you run it" },
        { text: "Severity 分级、Runbook 重要性" },
      ]},
      { icon: "🔨", title: "实践（1.5h）", items: [
        { text: "为书签项目写 Runbook（常见问题排查手册）" },
        { text: "CloudWatch 创建 Dashboard（调用次数、错误率、延迟）" },
      ]},
      { icon: "🏋️", title: "今日一练（20min）", exercise: true, items: [
        { text: "模拟 Oncall：让 Lambda 超时，排查并记录过程" },
      ], output: "✅ 产出：排查过程记录" },
    ]
  },
  {
    day: 29, date: "4/24", weekday: "周五", title: "入职前 Soft Skills",
    sections: [
      { icon: "📖", title: "学习 + 准备（2h）", items: [
        { text: "1:1 Meeting 技巧：提前准备议题" },
        { text: "提问的艺术：先查 15 分钟再问" },
        { text: "准备 30 秒自我介绍（英文）" },
      ]},
      { icon: "🏋️", title: "今日一练（15min）", exercise: true, items: [
        { text: "准备入职第一天给 Manager 发的消息" },
      ], output: "✅ 产出：自我介绍消息" },
    ]
  },
  { day: 30, date: "4/25", weekday: "周六", rest: true, title: "休息日 🎉" },
  // Week 6
  {
    day: 31, date: "4/27", weekday: "周一", title: "技术总复盘",
    sections: [
      { icon: "🔨", title: "闪卡测试（2h）", items: [
        { text: "不看笔记回答：冷启动、PK 选择、L1/L2/L3、synth vs deploy..." },
        { text: "答不上来的回去看对应 Week 笔记" },
        { text: "整理成一张 Cheat Sheet 打印" },
      ]},
      { icon: "🏋️", title: "今日一练（30min）", exercise: true, items: [
        { text: "从零用 CDK 部署 Lambda + DynamoDB + API Gateway，计时！" },
      ], output: "✅ 产出：计时记录" },
    ]
  },
  {
    day: 32, date: "4/28", weekday: "周二", title: "个人 Portfolio 整理",
    sections: [
      { icon: "🔨", title: "整理成果（2h）", items: [
        { text: "整理 5 周所有项目，每个写 3 句话总结" },
        { text: "最好的 1-2 个项目推到 GitHub" },
        { text: "更新 LinkedIn" },
      ]},
    ]
  },
  {
    day: 33, date: "4/29", weekday: "周三", title: "开发环境准备",
    sections: [
      { icon: "🔨", title: "模拟 Day 1 环境（1.5h）", items: [
        { text: "确认工具：JDK 21 (Corretto)、Maven、IntelliJ、AWS CLI v2、CDK CLI、Git" },
        { text: "了解 Amazon 内部工具名：Brazil、Pipelines、CR、Sim、Wiki" },
      ]},
      { icon: "🏋️", title: "今日一练（15min）", exercise: true, items: [
        { text: "安装 Amazon Corretto JDK 21，java -version 截图" },
      ], output: "✅ 产出：版本截图" },
    ]
  },
  {
    day: 34, date: "4/30", weekday: "周四", title: "入职 Checklist",
    sections: [
      { icon: "📋", title: "逐项确认", items: [
        { text: "技术：Java Lambda ✓ DynamoDB ✓ CDK ✓ CloudWatch ✓ API Gateway ✓" },
        { text: "文化：16 条 LP ✓ Design Doc ✓ Code Review ✓ Oncall ✓" },
        { text: "软技能：自我介绍 ✓ 提问技巧 ✓ 1:1 模板 ✓" },
        { text: "后勤：Badge、笔记工具、orientation 时间地点、Manager 联系方式" },
      ]},
    ]
  },
  {
    day: 35, date: "5/1-5/3", weekday: "周五-周日", rest: true, title: "最后的放松 💆",
    sections: [
      { icon: "💆", title: "这几天做什么？", items: [
        { text: "不要学新东西了 — 你已经准备得够好了" },
        { text: "好好休息，调整作息" },
        { text: "跟朋友/家人庆祝一下 🎉" },
        { text: "周日晚上早睡，明天就是 Day 1！" },
      ]},
    ]
  },
];

/** Get study day for a given ISO date string (e.g. "2026-03-25") */
export function getStudyDayByDate(isoDate: string): StudyDay | undefined {
  const dayNum = dateToDay[isoDate];
  if (dayNum === undefined) return undefined;
  return studyDays.find((d) => d.day === dayNum);
}

/** Get current week info for a given ISO date */
export function getStudyWeekByDate(isoDate: string): StudyWeek | undefined {
  const dayNum = dateToDay[isoDate];
  if (dayNum === undefined) return undefined;
  // Map day number to week: days 1-6 → week 1, 7-12 → week 2, etc.
  const weekRanges: [number, number, number][] = [
    [1, 6, 1], [7, 12, 2], [13, 18, 3], [19, 24, 4], [25, 30, 5], [31, 35, 6],
  ];
  for (const [start, end, weekId] of weekRanges) {
    if (dayNum >= start && dayNum <= end) {
      return studyWeeks.find((w) => w.id === weekId);
    }
  }
  return undefined;
}

/** Get all items as a flat list with unique keys for a given day */
export function getFlatItems(day: StudyDay): { key: string; text: string; sub?: string; sectionTitle: string; sectionIcon: string; exercise: boolean }[] {
  if (!day.sections) return [];
  const items: { key: string; text: string; sub?: string; sectionTitle: string; sectionIcon: string; exercise: boolean }[] = [];
  let globalIdx = 0;
  for (const section of day.sections) {
    for (const item of section.items) {
      items.push({
        key: `d${day.day}-${globalIdx}`,
        text: item.text,
        sub: item.sub,
        sectionTitle: section.title,
        sectionIcon: section.icon,
        exercise: section.exercise ?? false,
      });
      globalIdx++;
    }
  }
  return items;
}
