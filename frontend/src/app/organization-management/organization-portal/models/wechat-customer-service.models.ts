/**
 * 微信客服配置数据模型
 */

export interface WechatConfig {
  id?: number;
  org_id: number;

  // 公众号配置
  official_account_appid: string;
  official_account_secret: string;
  official_account_token: string;
  official_account_encoding_aes_key: string;
  official_account_verified: boolean;

  // 小程序配置
  mini_program_appid: string;
  mini_program_secret: string;
  mini_program_appname: string;

  // 企业微信配置
  wecom_corp_id: string;
  wecom_agent_id: string;
  wecom_secret: string;
  wecom_token: string;
  wecom_encoding_aes_key: string;

  // 微信支付配置
  mch_id: string; // 商户号
  api_key_v3: string; // APIv3 密钥
  apiclient_cert_path?: string; // 商户证书路径
  apiclient_key_path?: string; // 商户私钥路径

  // 客服功能开关
  enable_auto_reply: boolean; // 自动回复
  enable_ai_assistant: boolean; // AI 客服
  enable_human_transfer: boolean; // 人工客服转接
  enable_message_queue: boolean; // 消息队列

  // AI 客服配置
  ai_model?: string; // AI 模型（如：ERNIE-Bot、Qwen）
  ai_api_key?: string; // AI API 密钥
  ai_confidence_threshold: number; // AI 置信度阈值（0-1）

  // 其他配置
  customer_service_hours?: string; // 客服工作时间
  max_queue_size?: number; // 最大排队人数
  notification_email?: string; // 通知邮箱

  created_at?: string;
  updated_at?: string;
}

export interface WechatMessage {
  msgid: string;
  from_user: string; // 发送者 OpenID
  to_account: string; // 接收账号
  create_time: number;
  msg_type: 'text' | 'image' | 'voice' | 'video' | 'location' | 'link';
  content?: string; // 文本内容
  pic_url?: string; // 图片链接
  media_id?: string; // 媒体文件 ID
  format?: string; // 语音格式
  recognition?: string; // 语音识别结果
  location_x?: number; // 地理位置 X
  location_y?: number; // 地理位置 Y
  scale?: number; // 地图缩放大小
  label?: string; // 位置信息
  title?: string; // 链接标题
  description?: string; // 链接描述
  url?: string; // 链接 URL
}

export interface UnifiedMessage {
  id: string;
  channel_id: 'wechat_mp' | 'wechat_mini' | 'wecom' | 'web';
  customer_id: string;
  customer_info: {
    nickname: string;
    avatar: string;
    union_id: string; // 跨渠道识别
    tags: string[]; // 客户标签
    source: string; // 来源渠道
  };
  content: {
    type: 'text' | 'image' | 'voice' | 'video';
    text?: string;
    media_url?: string;
  };
  timestamp: number;
  status: 'unread' | 'reading' | 'replied' | 'closed';
  assigned_agent?: string; // 分配给哪个客服
}

export interface MessageSession {
  session_id: string;
  customer_openid: string;
  customer_nickname: string;
  customer_avatar: string;
  channel: 'wechat_mp' | 'wechat_mini' | 'wecom';
  messages: UnifiedMessage[];
  start_time: number;
  last_message_time: number;
  status: 'active' | 'waiting' | 'closed';
  assigned_agent?: string;
  waiting_duration?: number; // 等待时长（秒）
}

export interface AgentStatus {
  agent_id: string;
  agent_name: string;
  status: 'online' | 'offline' | 'busy' | 'away';
  current_chats: number;
  max_chats: number;
  today_replies: number;
  avg_response_time: number; // 平均响应时间（秒）
  satisfaction_rate: number; // 满意度（%）
}

export interface ChatStatistics {
  total_sessions: number;
  active_sessions: number;
  total_messages: number;
  ai_replied_count: number;
  human_replied_count: number;
  avg_response_time: number;
  satisfaction_rate: number;
  missed_chats: number;
}
