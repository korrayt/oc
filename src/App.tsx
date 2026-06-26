import { useEffect, useMemo, useState } from "react";
import { useRef, type ChangeEvent } from "react";
import JSZip from "jszip";
import "./App.css";

type Page =
  | "chat"
  | "terminal"
  | "hub"
  | "capabilities"
  | "packs"
  | "repository"
  | "coding"
  | "persona"
  | "upgrades"
  | "continuation"
  | "models"
  | "license"
  | "settings";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type UiLanguage = "tr" | "en";

type ChatUploadKind = "image" | "audio" | "text" | "file";
type ChatPanelTab = "messages" | "sessions";

type PendingChatUpload = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  kind: ChatUploadKind;
  textSnippet?: string;
};

type LicenseStatus = "missing" | "valid" | "invalid" | "restricted";
type OllamaStatus = "unknown" | "online" | "offline";
type AuthMode = "login" | "register" | "recover";
type AccountRole = "admin" | "member";
type AccountApprovalStatus = "approved" | "pending";
type AccountAccessStatus = "active" | "inactive";

type AccountRecord = {
  username: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  role: AccountRole;
  approvalStatus: AccountApprovalStatus;
  accessStatus: AccountAccessStatus;
  fullName?: string;
  email?: string;
  phone?: string;
  approvedAt?: string;
  approvedBy?: string;
  deactivatedAt?: string;
  deactivatedBy?: string;
};

type PasswordRecoveryQuestion = {
  id: "q1" | "q2";
  text: string;
};

type PasswordRecoveryAttempt = {
  id: string;
  createdAt: string;
  username: string;
  expiresAt: string;
  questions: PasswordRecoveryQuestion[];
  verified: boolean;
  failedCount: number;
  recoveryToken?: string;
};

type TemporaryAccessProfile = {
  id: string;
  issuedAt: string;
  expiresAt: string;
  reason: string;
  scopes: Page[];
  restrictions: string[];
};

type TemporaryChangeProposal = {
  id: string;
  createdAt: string;
  source: UpgradeActionSource;
  targetType: UpgradeApplyTarget;
  targetId: string;
  title: string;
  description: string;
  operationId?: string;
  status: "pending" | "approved" | "rejected";
  reviewedAt?: string;
  reviewedBy?: string;
};

type EngineDiagnosticReport = {
  runAt: string;
  operationId: string;
  source: UpgradeActionSource | "pack-self-dev";
  action: "suggest" | "apply";
  result: "success" | "skipped" | "error";
  errorCode?: string;
  note: string;
};

type OpenedSourcePreview = {
  id: string;
  title: string;
  url: string;
  source: UpgradeActionSource | "capability-research";
  openedAt: string;
  operationId: string;
  status: "opened" | "copied" | "queued";
  note?: string;
};

type BrowserTab = {
  id: string;
  title: string;
  url: string;
  history: string[];
  historyIndex: number;
  reloadToken: number;
  loading: boolean;
  createdAt: string;
  lastVisitedAt: string;
};

type BrowserHistoryEntry = {
  id: string;
  tabId: string;
  title: string;
  url: string;
  visitedAt: string;
};

type BrowserFavoriteEntry = {
  id: string;
  title: string;
  url: string;
  createdAt: string;
};

type DownloadApprovalRequest = {
  id: string;
  createdAt: string;
  url: string;
  sourceDomain: string;
  fileName: string;
  extension: string;
  suggestedPath: string;
  referer?: string;
  status: "pending" | "approved" | "rejected" | "failed" | "completed";
  note?: string;
};

type DownloadApprovalDecision = {
  requestId: string;
  approved: boolean;
  targetPath?: string;
  note?: string;
};

type DownloadAuditEntry = {
  id: string;
  requestId: string;
  at: string;
  sourceDomain: string;
  fileName: string;
  url: string;
  targetPath: string;
  result: "approved" | "rejected" | "completed" | "failed";
  note: string;
  operationId?: string;
};

type Capability = {
  id: string;
  name: string;
  status: "active" | "ready" | "planned" | "restricted" | "offline";
  source: "core" | "module";
  description: string;
};

type CustomCapability = Capability & {
  isCustom: true;
  createdAt: string;
};

type CapabilityCard = Capability & {
  isCustom?: true;
  createdAt?: string;
  isArchived?: boolean;
  isPaused?: boolean;
};

type CapabilityOverride = {
  name?: string;
  description?: string;
  isArchived?: boolean;
  isPaused?: boolean;
  updatedAt: string;
};

type CapabilityResearchLink = {
  label: string;
  description: string;
  url: string;
};

type CapabilityLibrarySuggestion = {
  id: string;
  capabilityId: string;
  capabilityName: string;
  libraryName: string;
  ecosystem: "npm" | "github" | "docs";
  reason: string;
  sourceUrl: string;
  createdAt: string;
};

type ScientificLibraryCatalogItem = {
  libraryName: string;
  ecosystem: "npm" | "github" | "docs";
  domains: Array<"math" | "quantum" | "chemistry">;
  reason: string;
  useCase: string;
  sourceUrl: string;
};

type UpgradeActionSource =
  | "capability"
  | "pack"
  | "repository"
  | "coding"
  | "upgrade-stage";

type UpgradeApplyTarget = "capability" | "pack";

type UpgradeSuggestionCard = {
  id: string;
  createdAt: string;
  source: UpgradeActionSource;
  title: string;
  description: string;
  sourceUrl?: string;
  target: UpgradeApplyTarget;
};

type PackSelfDevelopmentTask = {
  id: string;
  createdAt: string;
  status: "draft" | "applied";
  title: string;
  summary: string;
  sourceSignals: string[];
  suggestion: UpgradeSuggestionCard;
};

type AutomationAuditEntry = {
  id: string;
  at: string;
  source: UpgradeActionSource | "pack-self-dev";
  action: "suggest" | "apply";
  operationId?: string;
  targetType: UpgradeApplyTarget;
  targetId: string;
  result: "success" | "skipped" | "error";
  note: string;
};

type ChatMemoryTopic = {
  key: string;
  title: string;
  count: number;
  lastIndex: number;
};

type PersonaProfile = {
  name: string;
  headline: string;
  bio: string;
  summary: string;
  traits: string[];
  additions: string[];
  avatarDataUrl: string;
};

type LanguageIdentityProfile = {
  signature: string;
  tone: string;
  principles: string[];
  avoid: string[];
  sampleOpenings: string[];
};

type UpgradeEngineReport = {
  runAt: string;
  focus: string;
  summary: string;
  ready: string[];
  gaps: string[];
  nextSteps: string[];
};

type ContinuationPlan = {
  runAt: string;
  mode: "manual" | "guided";
  focus: string;
  handoff: string;
  nextPage: Page;
  nextHubTab?: HubTab;
  nextPageLabel: string;
  nextSteps: string[];
  carryForward: string[];
};

type OllamaModel = {
  name: string;
  size?: number;
  modified_at?: string;
};

type CorePackProfile = {
  id: string;
  name: string;
  type: string;
  description: string;
  prompt: string;
  source: "bundled" | "imported" | "custom";
};

type CorePackManifest = {
  id?: string;
  name?: string;
  type?: string;
  description?: string;
  entryPrompt?: string;
  version?: string;
  minCoreVersion?: string;
  offline?: boolean;
  permissions?: string[];
};

type RepositorySource = "github" | "gitlab";
type HubTab =
  | "capabilities"
  | "upgrades"
  | "packs"
  | "repository"
  | "models"
  | "coding"
  | "browser";

const HUB_TABS: HubTab[] = [
  "capabilities",
  "upgrades",
  "packs",
  "repository",
  "models",
  "coding",
  "browser",
];

function isHubTab(value: unknown): value is HubTab {
  return typeof value === "string" && HUB_TABS.includes(value as HubTab);
}

type PackDraft = {
  name: string;
  type: string;
  description: string;
  prompt: string;
};

type CapabilityDraft = {
  name: string;
  description: string;
};

type ActivityLogEntry = {
  id: string;
  at: string;
  message: string;
  tone: "info" | "success" | "warn" | "error";
  operationId?: string;
};

type TerminalRunEntry = {
  id: string;
  at: string;
  command: string;
  stdout: string;
  stderr: string;
  statusCode: number;
};

type GithubPackagePullResult = {
  repoUrl: string;
  packageName: string;
  branch: string;
  destinationPath: string;
  stdout: string;
  stderr: string;
  statusCode: number;
};

type PreparedDownloadResult = {
  requestId: string;
  url: string;
  sourceDomain: string;
  fileName: string;
  extension: string;
  suggestedPath: string;
  createdAt: string;
};

type DownloadExecutionResult = {
  requestId: string;
  url: string;
  targetPath: string;
  statusCode: number;
  bytesWritten: number;
  completedAt: string;
};

type ShareLinkSessionStatus = "active" | "completed" | "revoked" | "expired";

type ShareLinkSession = {
  id: string;
  createdAt: string;
  createdBy: string;
  recipientLabel: string;
  topic: string;
  instruction: string;
  maxMessages: number;
  expiresAt: string;
  status: ShareLinkSessionStatus;
  url: string;
  guestDisplayName?: string;
  completedAt?: string;
  lastMessageAt?: string;
  transcript: Message[];
};

type ExternalConversationRecord = {
  id: string;
  sessionId: string;
  topic: string;
  recipientLabel: string;
  guestDisplayName?: string;
  status: ShareLinkSessionStatus;
  createdAt: string;
  completedAt?: string;
  lastMessageAt?: string;
  messageCount: number;
  summary: string;
  transcript: Message[];
};

const STORAGE_KEYS = {
  chatHistory: "core-i-chat-history",
  chatPanelTab: "core-i-chat-panel-tab",
  model: "core-i-model",
  licenseToken: "core-i-license-token",
  licenseStatus: "core-i-license-status",
  eulaAccepted: "core-i-eula-accepted",
  privacyAccepted: "core-i-privacy-accepted",
  telemetryAccepted: "core-i-telemetry-accepted",
  uiLanguage: "core-i-ui-language",
  onlineAccessEnabled: "core-i-online-access-enabled",
  learningFromUser: "core-i-learning-from-user",
  trendAwareReplies: "core-i-trend-aware-replies",
  creativeStyleLearning: "core-i-creative-style-learning",
  activePackId: "core-i-active-pack-id",
  importedPacks: "core-i-imported-packs",
  customPacks: "core-i-custom-packs",
  repoSource: "core-i-repo-source",
  repoUrl: "core-i-repo-url",
  repoPath: "core-i-repo-path",
  repoRef: "core-i-repo-ref",
  repoPackageName: "core-i-repo-package-name",
  accounts: "core-i-accounts",
  session: "core-i-session",
  recoveryAttempt: "core-i-recovery-attempt",
  temporaryAccessProfile: "core-i-temporary-access-profile",
  temporaryChangeProposals: "core-i-temporary-change-proposals",
  codingModel: "core-i-coding-model",
  codingSearch: "core-i-coding-search",
  codingChatHistory: "core-i-coding-chat-history",
  assistantAvatarDataUrl: "core-i-assistant-avatar-data-url",
  masterPersonaName: "core-i-master-persona-name",
  masterPersonaHeadline: "core-i-master-persona-headline",
  masterPersonaBio: "core-i-master-persona-bio",
  languageIdentityProfile: "core-i-language-identity-profile",
  capabilityDevelopment: "core-i-capability-development",
  customCapabilities: "core-i-custom-capabilities",
  capabilityOverrides: "core-i-capability-overrides",
  capabilityOrder: "core-i-capability-order",
  capabilityResearchTarget: "core-i-capability-research-target",
  capabilityLibraryPool: "core-i-capability-library-pool",
  capabilityLibraryPending: "core-i-capability-library-pending",
  upgradeStageOrder: "core-i-upgrade-stage-order",
  upgradeEngineReport: "core-i-upgrade-engine-report",
  continuationMode: "core-i-continuation-mode",
  continuationPlan: "core-i-continuation-plan",
  productEnabled: "core-i-product-enabled",
  activityLog: "core-i-activity-log",
  upgradeSuggestion: "core-i-upgrade-suggestion",
  packSelfDevelopmentTasks: "core-i-pack-self-dev-tasks",
  automationAudit: "core-i-automation-audit",
  chatMemoryExcludedTopics: "core-i-chat-memory-excluded-topics",
  terminalHistory: "core-i-terminal-history",
  shareLinkSessions: "core-i-share-link-sessions",
  externalConversations: "core-i-external-conversations",
  openedSourcePreviews: "core-i-opened-source-previews",
  engineDiagnostics: "core-i-engine-diagnostics",
  browserTabs: "core-i-browser-tabs",
  browserHistory: "core-i-browser-history",
  browserFavorites: "core-i-browser-favorites",
  downloadQueue: "core-i-download-queue",
  downloadAudit: "core-i-download-audit",
};


const CHAT_UI_TEXT: Record<
  UiLanguage,
  {
    title: string;
    subtitle: string;
    badge: string;
    restrictedWarning: string;
    thinking: string;
    placeholderRestricted: string;
    placeholderNormal: string;
    send: string;
    attach: string;
    dropHint: string;
    uploadReady: string;
  }
> = {
  tr: {
    title: "Sohbet",
    subtitle: "Yerel LLM ile konuş. Sohbet geçmişi cihazda saklanır.",
    badge: "Local Chat",
    restrictedWarning:
      "Lisans geçerli değil. Chat şu anda sınırlı modda. Lisans ekranından EULA/Gizlilik kabulü ve token doğrulaması yap.",
    thinking: "Düşünüyorum...",
    placeholderRestricted: "Chat için geçerli lisans gerekiyor...",
    placeholderNormal: "Bir şey sor...",
    send: "Gönder",
    attach: "Dosya ekle",
    dropHint: "Görsel, metin, dosya veya sesi buraya sürükleyip bırak.",
    uploadReady: "Eklenen materyaller",
  },
  en: {
    title: "Chat",
    subtitle: "Talk with a local LLM. Chat history is stored on this device.",
    badge: "Local Chat",
    restrictedWarning:
      "License is not valid. Chat is currently in restricted mode. Go to the License page and complete EULA/Privacy acceptance and token validation.",
    thinking: "Thinking...",
    placeholderRestricted: "A valid license is required for chat...",
    placeholderNormal: "Ask something...",
    send: "Send",
    attach: "Attach",
    dropHint: "Drag and drop image, text, file, or audio here.",
    uploadReady: "Attached materials",
  },
};

const defaultMessages: Message[] = [
  {
    role: "assistant",
    content:
      "Merhaba. Ben OC. Yerel ve offline öncelikli bir AI çekirdeği olarak hazırlanıyorum. Lisans geçerli olduğunda Ollama üzerinden yerel modelle konuşabilirim.",
  },
];

const MASTER_ADMIN_PROFILE = {
  fullName: "Soner Koray Taşan",
  email: "ben@koraytasan.com",
  phone: "+90 5553163797",
} as const;

const ADMIN_RECOVERY_QUESTIONS: PasswordRecoveryQuestion[] = [
  { id: "q1", text: "Master persona başlığının ilk kelimesi nedir?" },
  { id: "q2", text: "Admin telefonunun son 4 hanesi nedir?" },
];

const TEMPORARY_PROFILE_SCOPES: Page[] = ["chat", "hub"];
const TEMPORARY_PROFILE_HUB_TABS: HubTab[] = ["capabilities", "models"];

const baseSystemPrompt = `
You are OC, a local-first and offline-first AI core.

PRIMARY LANGUAGE RULE:
- Always answer in the same language the user uses.
- If the user writes in Turkish, answer in natural Turkish.
- If the user writes in English, answer in natural English.
- If the user writes in Spanish, answer in natural Spanish.
- If the user writes in German, answer in natural German.
- If the user writes in French, answer in natural French.
- Do not randomly mix languages inside the same answer.
- If a technical term is commonly known in English, you may include it in parentheses after the native-language explanation.
- If the user explicitly asks for translation or multilingual output, then use the requested languages.

QUALITY RULES:
- Use clean, fluent, native-sounding language.
- Keep sentences clear and understandable.
- Do not invent facts.
- If you do not know something, say so.
- If you do not have internet access, say so clearly.
- Avoid unnecessary repetition.
- Answer the user's actual question directly.

SAFETY RULES:
- Keep Safe Mode active.
- Do not provide step-by-step instructions for harmful, illegal, or dangerous actions.
- If a license token is invalid, missing, revoked, or expired, clearly state that OC is in restricted mode.
- Never produce manipulated, fake, hidden, stealth, or misleading responses.

ARCHITECTURE RULES:
- Skill packs may extend your abilities, role, persona, workflow, knowledge, or tools.
- If no skill pack is active, behave as a general local assistant.
`;

const scientificLibraryCatalog: ScientificLibraryCatalogItem[] = [
  {
    libraryName: "mathjs",
    ecosystem: "github",
    domains: ["math"],
    reason:
      "Geniş kapsamlı sayısal matematik, birim, matris, fonksiyon ve ifade işleme altyapısı.",
    useCase:
      "Matematiksel ifadeleri ayrıştırma, birim dönüşümü, matris hesabı ve kontrollü formül çözümleme.",
    sourceUrl: "https://github.com/josdejong/mathjs",
  },
  {
    libraryName: "nerdamer",
    ecosystem: "npm",
    domains: ["math"],
    reason:
      "Sembolik cebir, denklem çözme, türev/integral ve ifade sadeleştirme için pratik JS katmanı.",
    useCase:
      "Cebirsel adım açıklama, sembolik dönüşüm ve öğretici matematik çıktıları.",
    sourceUrl: "https://www.npmjs.com/package/nerdamer",
  },
  {
    libraryName: "ml-matrix",
    ecosystem: "npm",
    domains: ["math"],
    reason:
      "Lineer cebir, matris ayrıştırmaları ve bilimsel hesaplama için küçük ama güçlü matris kütüphanesi.",
    useCase:
      "Vektör/matris işlemleri, regresyon altyapısı ve sayısal analiz hazırlığı.",
    sourceUrl: "https://www.npmjs.com/package/ml-matrix",
  },
  {
    libraryName: "quantum-circuit",
    ecosystem: "github",
    domains: ["quantum"],
    reason:
      "Tarayıcı/Node tarafında kuantum devresi modelleme ve temel simülasyon denemeleri için uygun açık kaynak seçenek.",
    useCase:
      "Qubit, gate, circuit akışı ve kuantum eğitim örnekleri için devre temelli çalışma.",
    sourceUrl: "https://github.com/quantastica/quantum-circuit",
  },
  {
    libraryName: "OpenFermion",
    ecosystem: "github",
    domains: ["quantum", "chemistry"],
    reason:
      "Kuantum kimyası, fermiyonik sistemler ve kuantum algoritmaları için akademik açık kaynak referans.",
    useCase:
      "Kuantum kimyası konularını açıklama, Hamiltonian/fermion kavramlarını yapılandırma ve araştırma yönlendirme.",
    sourceUrl: "https://github.com/quantumlib/OpenFermion",
  },
  {
    libraryName: "openchemlib-js",
    ecosystem: "github",
    domains: ["chemistry"],
    reason:
      "Molekül yapısı, kimyasal gösterim ve cheminformatics işlemleri için kapsamlı JavaScript hattı.",
    useCase:
      "SMILES, molekül özellikleri, yapı analizi ve kimya öğretimi için yerel-first kimya katmanı.",
    sourceUrl: "https://github.com/cheminfo/openchemlib-js",
  },
  {
    libraryName: "RDKit.js",
    ecosystem: "github",
    domains: ["chemistry"],
    reason:
      "RDKit'in web/WASM hattı; molekül çizimi, fingerprint ve cheminformatics iş akışları için güçlü seçenek.",
    useCase:
      "SMILES doğrulama, molekül görselleştirme, benzerlik ve kimyasal veri analizi planı.",
    sourceUrl: "https://github.com/rdkit/rdkit-js",
  },
];

const scientificLibraryPrompt = scientificLibraryCatalog
  .map(
    (item) =>
      `- ${item.libraryName} [${item.domains.join(", ")}]: ${item.reason} Kullanım: ${item.useCase}`
  )
  .join("\n");

const defaultMasterPersonaName = "Koray Taşan";
const defaultMasterPersonaHeadline =
  "Görüntünün, Hikâyenin ve Yeni Nesil Yapay Zekâ Üretiminin Peşinde";
const defaultMasterPersonaBio = `
Koray Taşan, görüntünün, hikâyenin ve yeni nesil yapay zekâ üretiminin peşinde ilerleyen bir yaratıcı üreticidir.

Video onun için sadece kayıt değil; ritim, ışık, ses, kurgu ve duygu kararlarının birleştiği yaşayan bir anlatıdır.
Markalı içeriklerden sosyal medya formatlarına, kurumsal işlerden deneysel AI akışlarına kadar aynı dikkatle üretim yapar.

Yerel-first araçları, açık ve dürüst davranan sistemleri ve üretim süreçlerini daha kontrollü hale getiren iş akışlarını önemser.
`.trim();

const defaultLanguageIdentityProfile: LanguageIdentityProfile = {
  signature:
    "OC; yerel, dürüst, yaratıcı, üretim odaklı ve Koray Taşan'ın anlatı ritmine uyumlanan kişisel AI çekirdeğidir.",
  tone:
    "Sakin, net, sıcak ve iş bitirici. Gerektiğinde yaratıcı, gerektiğinde mühendis gibi kesin ve ölçülü.",
  principles: [
    "Kullanıcının yazdığı dilde doğal ve temiz cevap ver.",
    "Önce gerçeği söyle; sınır, eksik bilgi veya offline durum varsa saklama.",
    "Koray'ın görüntü, hikâye, ritim, kurgu ve sistem kurma bakışını yaratıcı işlerde görünür kıl.",
    "Boş vaat yerine uygulanabilir adım, karar noktası ve gerekçe üret.",
    "Kısa cevap gereken yerde kısa kal; karmaşık işlerde yapılandırılmış ve takip edilebilir cevap ver.",
  ],
  avoid: [
    "Stealth, manipüle, sahte normal davranış veya belirsiz vaat üretme.",
    "Kullanıcının üslubunu taklit ederken yapay, abartılı veya pazarlama kokan dile kayma.",
    "Bilmediğin şeyi kesin bilgi gibi sunma.",
    "Aynı cümle kalıplarını her yanıtta tekrar etme.",
  ],
  sampleOpenings: [
    "Netleştirelim: ...",
    "Bunu iki katmanda ele alalım: ...",
    "Şu an en güvenli adım şu: ...",
  ],
};

function normalizeIdentityLines(value: unknown, fallback: string[]) {
  if (Array.isArray(value)) {
    const lines = value
      .filter((item): item is string => typeof item === "string")
      .map((item) => normalizeWhitespace(item))
      .filter(Boolean);
    return lines.length > 0 ? lines.slice(0, 12) : fallback;
  }

  if (typeof value === "string") {
    const lines = value
      .split(/\r?\n/)
      .map((item) => normalizeWhitespace(item))
      .filter(Boolean);
    return lines.length > 0 ? lines.slice(0, 12) : fallback;
  }

  return fallback;
}

function sanitizeLanguageIdentityProfile(value: Partial<LanguageIdentityProfile>) {
  return {
    signature:
      normalizeWhitespace(value.signature || "") ||
      defaultLanguageIdentityProfile.signature,
    tone:
      normalizeWhitespace(value.tone || "") ||
      defaultLanguageIdentityProfile.tone,
    principles: normalizeIdentityLines(
      value.principles,
      defaultLanguageIdentityProfile.principles
    ),
    avoid: normalizeIdentityLines(value.avoid, defaultLanguageIdentityProfile.avoid),
    sampleOpenings: normalizeIdentityLines(
      value.sampleOpenings,
      defaultLanguageIdentityProfile.sampleOpenings
    ),
  };
}

function readStoredLanguageIdentityProfile(): LanguageIdentityProfile {
  const raw = localStorage.getItem(STORAGE_KEYS.languageIdentityProfile);
  if (!raw) return defaultLanguageIdentityProfile;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return defaultLanguageIdentityProfile;
    }
    return sanitizeLanguageIdentityProfile(
      parsed as Partial<LanguageIdentityProfile>
    );
  } catch {
    return defaultLanguageIdentityProfile;
  }
}

function formatIdentityPromptLines(lines: string[]) {
  return lines
    .map((item) => normalizeWhitespace(item))
    .filter(Boolean)
    .slice(0, 12)
    .map((item) => `  - ${item}`)
    .join("\n");
}

function buildSystemPrompt({
  learningFromUser,
  trendAwareReplies,
  creativeStyleLearning,
  capabilityDevelopment,
  onlineAccessEnabled,
  activePack,
  personaProfile,
  languageIdentityProfile,
  continuationMode,
}: {
  learningFromUser: boolean;
  trendAwareReplies: boolean;
  creativeStyleLearning: boolean;
  capabilityDevelopment: boolean;
  onlineAccessEnabled: boolean;
  activePack: CorePackProfile | null;
  personaProfile: PersonaProfile;
  languageIdentityProfile: LanguageIdentityProfile;
  continuationMode: boolean;
}) {
  const learningRules = `
LEARNING RULES:
- User-learning mode is ${learningFromUser ? "enabled" : "disabled"}.
- Creative style learning is ${creativeStyleLearning ? "enabled" : "disabled"}.
- Trend-aware responses are ${trendAwareReplies ? "enabled" : "disabled"}.
- Capability development mode is ${capabilityDevelopment ? "enabled" : "disabled"}.
- Internet access mode is ${onlineAccessEnabled ? "enabled by admin" : "disabled (offline-first)"}.
- When user-learning mode is enabled, adapt your wording to user feedback and recurring preferences.
- If trend-aware responses are enabled but live internet access is unavailable, state this clearly and rely on local context instead of pretending research.
- Never claim you analyzed external trends unless you actually did.
- If capability development mode is enabled, study the currently exposed capability topics, suggest missing subskills, and propose concrete upgrades without claiming you have already implemented them.
`;

  const packRules = activePack
    ? `
PACK RULES:
- Active pack: ${activePack.name}
${activePack.prompt}
`
    : `
PACK RULES:
- No pack is active.
`;

  const personaRules = `
PERSONA RULES:
- Master persona: ${personaProfile.name}
- Persona headline: ${personaProfile.headline}
- Persona traits: ${personaProfile.traits.join(", ")}
- OC additions:
${personaProfile.additions.map((item) => `  - ${item}`).join("\n")}
- Keep the persona supportive, clear, creative, and local-first.
`;

  const languageIdentityRules = `
CORE-I LANGUAGE IDENTITY:
- Signature: ${languageIdentityProfile.signature}
- Tone: ${languageIdentityProfile.tone}
- Response principles:
${formatIdentityPromptLines(languageIdentityProfile.principles)}
- Avoid:
${formatIdentityPromptLines(languageIdentityProfile.avoid)}
- Optional opening patterns, only when they fit naturally:
${formatIdentityPromptLines(languageIdentityProfile.sampleOpenings)}
- Do not force a catchphrase. The identity should feel consistent, not repetitive.
- Be original through judgment, structure, rhythm, and honesty; not through decoration.
`;

  const scienceRules = `
SCIENTIFIC LIBRARY RULES:
- OC has a curated scientific library map for mathematics, quantum computing, and chemistry.
- Use this map to choose libraries, explain workflows, and structure scientific reasoning:
${scientificLibraryPrompt}
- If a real execution backend is not connected for a calculation, do not claim that code was executed.
- For high-stakes scientific, chemical, medical, safety, or industrial use, state uncertainty and ask for verification by a qualified expert.
- Prefer transparent derivations, assumptions, units, constraints, and reproducible steps.
`;

  const continuationRules = `
CONTINUATION RULES:
- Continuation mode is ${continuationMode ? "enabled" : "disabled"}.
- When a task appears complete, produce a concise handoff with the next safe step.
- If continuation mode is enabled, prefer a clear next-page / next-action recommendation instead of stopping at a summary.
- Never claim autonomous background execution you do not actually perform.
- Be explicit about what needs user approval and what can proceed locally.
`;

  return `${baseSystemPrompt}\n${learningRules}\n${personaRules}\n${languageIdentityRules}\n${scienceRules}\n${continuationRules}\n${packRules}`;
}

const plannedPacks = [
  {
    name: "Scientific & Educational Modules",
    type: "Knowledge",
    description:
      "Bilim, eğitim, araştırma, ders anlatımı, konu öğretimi ve akademik destek modülleri.",
  },
  {
    name: "Creative Production Modules",
    type: "Creative",
    description:
      "Video, görsel, yazı, senaryo, müzik, tasarım, kurgu ve yaratıcı üretim iş akışları.",
  },
  {
    name: "Personal Development Modules",
    type: "Growth",
    description:
      "Kişisel gelişim, öğrenme, alışkanlık, motivasyon, koçluk ve günlük gelişim destekleri.",
  },
  {
    name: "Professional Role Modules",
    type: "Role",
    description:
      "Yöneticilik, asistanlık, danığmanlık, planlama, analiz, raporlama ve mesleki roller.",
  },
  {
    name: "Companion & Social Persona Modules",
    type: "Persona",
    description:
      "Sohbet arkadaşı, sosyal rol, yaşam asistanı, karakter/persona ve ilişki odaklı modüller.",
  },
  {
    name: "Lifestyle & Daily Assistant Modules",
    type: "Lifestyle",
    description:
      "Günlük yaşam, organizasyon, rutinler, eğlence, öneriler ve kişisel yardımcı modülleri.",
  },
  {
    name: "Relationship & Intimacy Modules",
    type: "Adult / Relationship",
    description:
      "Yalnızca yasal sınırlar içinde; uygun yaş, açık rıza ve güvenli kullanım koşullarına bağlı ilişki, yakınlık ve yetişkin odaklı modüller.",
  },
  {
    name: "Custom Capability Modules",
    type: "Open",
    description:
      "OC mimarisiyle uyumlu herhangi bir yasal yetenek, rol, persona, veri, model veya iş akışı uzantısı.",
  },
];

const upgradeStages = [
  {
    id: "text-foundation",
    title: "Metin çekirdeğini sağlamlaştır",
    status: "active",
    summary:
      "Doğru dil, lisans durumu, local hafıza ve paket davranışını koru.",
    required: [
      "Sohbet + localStorage hafıza",
      "Lisans gate ve açık sınırlı mod",
      ".corepack yükleme ve aktif pack prompt katmanı",
    ],
  },
  {
    id: "image-generation",
    title: "Görsel oluşturma hattını aç",
    status: "planned",
    summary:
      "Yazıdan görsele geçiş için prompt öğrenme, stil hafızası ve üretim sağlayıcısı katmanı ekle.",
    required: [
      "Visual Style Studio girdileri",
      "Yerel veya bağlanabilir image provider adapter",
      "Üretilen görseller için yerel önizleme ve kayıt",
    ],
  },
  {
    id: "voice-analysis",
    title: "Ses analizi hattını ekle",
    status: "planned",
    summary:
      "Konuşmayı metne çevir, konuşmacı ve ton işaretlerini ayrı katmanda işle.",
    required: [
      "STT entegrasyonu",
      "Konuğmacı ayrımı / ton notu",
      "Ses girdisi için güvenli izin akışı",
    ],
  },
  {
    id: "image-analysis",
    title: "Görüntü analizi hattını ekle",
    status: "planned",
    summary:
      "OCR, sahne özetleme ve nesne bağlamı ile görselleri metne bağla.",
    required: [
      "OCR katmanı",
      "Görsel özet ve belirsizlik bildirimi",
      "Yerel dosya seçimi ile güvenli işleme",
    ],
  },
  {
    id: "general-awareness",
    title: "Genel farkındalık motoru",
    status: "planned",
    summary:
      "Metin + ses + görüntü sinyallerini tek durum resmi altında birleştir.",
    required: [
      "Multimodal sinyal birleştirme",
      "Belirsizlik skoru ve açık uyarılar",
      "Kullanıcı tercihine göre derinlik seviyesi",
    ],
  },
  {
    id: "cloud-bridges",
    title: "Bulut köprülerini isteğe bağlı aç",
    status: "planned",
    summary:
      "ChatGPT ve Gemini gibi dış sağlayıcılar için açık API köprüsü hazırla, ama yerel akışı bozma.",
    required: [
      "Ayrı provider adapter",
      "API anahtarını kullanıcıdan açıkça isteme",
      "Yerel-first davranış ve şeffaf uyarı",
    ],
  },
];

const codingSearchSuggestions = [
  {
    id: "tauri-tools",
    title: "Tauri masaüstü araçları",
    summary:
      "Pencere, dosya seçimi, menü ve yerel entegrasyon için sağlam Tauri/Rust eklentileri ara.",
    query:
      "tauri plugin dialog fs shell window app Rust desktop repository",
    hints: [
      "@tauri-apps/plugin-dialog",
      "@tauri-apps/plugin-fs",
      "@tauri-apps/plugin-shell",
    ],
  },
  {
    id: "repo-tools",
    title: "Repo ve Git araçları",
    summary:
      "GitHub/GitLab dosya çekme, repo inceleme ve otomatik güncelleme için kütüphaneler ara.",
    query: "octokit simple-git gitlab api repository file fetch",
    hints: ["octokit", "simple-git", "@gitbeaker/rest"],
  },
  {
    id: "ai-local",
    title: "Yerel AI entegrasyonu",
    summary:
      "Ollama, llama.cpp, model yönetimi ve yerel inference için uygun kitaplıkları bul.",
    query: "ollama api llama.cpp local model inference typescript rust",
    hints: ["ollama", "llama.cpp", "langchain"],
  },
  {
    id: "vision-text",
    title: "Görsel ve OCR",
    summary:
      "Görsel analiz, OCR ve belge okuma için uygun paketleri öneri olarak tara.",
    query: "sharp tesseract.js ocr image analysis node typescript",
    hints: ["sharp", "tesseract.js", "opencv.js"],
  },
  {
    id: "media-pipeline",
    title: "Video ve ses hattı",
    summary:
      "Ses analizi, video işleme ve sinyal hattı için altyapı kütüphanelerini ara.",
    query: "ffmpeg fluent-ffmpeg audio speech video pipeline",
    hints: ["ffmpeg", "fluent-ffmpeg", "whisper.cpp"],
  },
  {
    id: "testing-ui",
    title: "Test ve UI araçları",
    summary:
      "Kodlama yeteneklerini güvenle kurmak için test ve arayüz yardımcılarını seç.",
    query: "playwright vitest testing library ui toolkit react",
    hints: ["playwright", "vitest", "@testing-library/react"],
  },
  {
    id: "scientific-computing",
    title: "Bilimsel kütüphaneler",
    summary:
      "Quantum, matematik ve kimya için yerel çalışabilecek hesaplama ve araştırma kütüphanelerini tara.",
    query:
      "mathjs nerdamer openchemlib rdkit quantum-circuit scientific computing chemistry quantum math",
    hints: ["mathjs", "openchemlib", "@rdkit/rdkit", "quantum-circuit"],
  },
];

const corePackProfiles: CorePackProfile[] = [
  {
    id: "science-core-pack",
    name: "Science Core Pack",
    type: "Scientific Pack",
    description:
      "Quantum, matematik ve kimya çalışmalarında kütüphane destekli analiz, açıklama ve araştırma akışı sağlar.",
    prompt: `- Treat math, quantum, and chemistry tasks as scientific workflows with assumptions, units, constraints, and verification notes.
- Use the local scientific library map when choosing tools: mathjs, nerdamer, ml-matrix, quantum-circuit, OpenFermion, openchemlib-js, and RDKit.js.
- For mathematics, separate symbolic reasoning, numerical calculation, and proof-style explanation.
- For quantum topics, separate concept explanation, circuit structure, simulation limits, and physical interpretation.
- For chemistry, separate molecule representation, reaction/structure reasoning, safety notes, and cheminformatics limits.
- Never invent experimental results, molecular properties, or safety claims. State uncertainty clearly and ask for verification when needed.`,
    source: "bundled",
  },
  {
    id: "teacher-pack",
    name: "Teacher Pack",
    type: "Role Pack",
    description:
      "Karmağık konuları adım adım, sade ve öğretici bir anlatımla açıkla.",
    prompt: `- Explain step by step with a teaching-first structure.
- Start concise, then expand with examples on demand.
- Ask short checkpoint questions when useful.`,
    source: "bundled",
  },
  {
    id: "narrative-pack",
    name: "Narrative Studio Pack",
    type: "Creative Pack",
    description:
      "Kullanıcıdan öğrenerek metin, senaryo ve hikaye üretiminde edebi anlatımı güçlendir.",
    prompt: `- Prioritize literary coherence, scene continuity, and emotional pacing.
- When user gives style feedback, adapt future drafts to that style.
- For scenario requests, include character intent and conflict arcs.`,
    source: "bundled",
  },
  {
    id: "visual-style-pack",
    name: "Visual Style Pack",
    type: "Creative Pack",
    description:
      "Kullanıcının görsel stil tercihlerini öğren ve üretim yönlendirmelerini bu stile göre yapılandır.",
    prompt: `- Track visual style preferences such as mood, palette, composition, and references.
- Offer 2-3 style alternatives before finalizing when the user is undecided.
- Keep prompts concrete and reusable for image generation workflows.`,
    source: "bundled",
  },
  {
    id: "video-story-pack",
    name: "Video Story Pack",
    type: "Creative Pack",
    description:
      "Kurgu dili ve sinematografi tercihlerini öğrenerek video sahne/sekans planlarını üret.",
    prompt: `- Structure outputs with sequence, shot intent, pacing, and transition notes.
- Incorporate user cinematography preferences across future video plans.
- Keep production notes practical for editing and storyboard pipelines.`,
    source: "bundled",
  },
];

function getStoredBoolean(key: string, fallback = false) {
  const value = localStorage.getItem(key);
  if (value === null) return fallback;
  return value === "true";
}

function getStoredUiLanguage(): UiLanguage {
  const value = localStorage.getItem(STORAGE_KEYS.uiLanguage);
  return value === "en" ? "en" : "tr";
}

function getStoredChatPanelTab(): ChatPanelTab {
  const value = localStorage.getItem(STORAGE_KEYS.chatPanelTab);
  return value === "sessions" ? "sessions" : "messages";
}

function getChatUploadKind(file: File): ChatUploadKind {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  if (
    file.type.startsWith("text/") ||
    /\.(txt|md|json|csv|tsv|log|yaml|yml|xml)$/i.test(file.name)
  ) {
    return "text";
  }
  return "file";
}

function formatChatUploadKind(kind: ChatUploadKind, language: UiLanguage) {
  const tr: Record<ChatUploadKind, string> = {
    image: "Görsel",
    audio: "Ses",
    text: "Metin",
    file: "Dosya",
  };
  const en: Record<ChatUploadKind, string> = {
    image: "Image",
    audio: "Audio",
    text: "Text",
    file: "File",
  };
  return language === "en" ? en[kind] : tr[kind];
}

function isRunningInTauri() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D+/g, "");
  if (!digits) return "";
  if (digits.startsWith("90")) return digits;
  if (digits.startsWith("0")) return `9${digits}`;
  return digits;
}

function isMasterAdminLoginIdentifier(value: string) {
  const normalized = normalizeUsername(value);
  return (
    normalized === normalizeUsername(MASTER_ADMIN_PROFILE.email) ||
    normalizePhone(value) === normalizePhone(MASTER_ADMIN_PROFILE.phone)
  );
}

function readStoredAccounts(): AccountRecord[] {
  const raw = localStorage.getItem(STORAGE_KEYS.accounts);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is AccountRecord => {
      if (!item || typeof item !== "object") return false;

      const candidate = item as Partial<AccountRecord>;
      const role =
        candidate.role === "admin" || candidate.role === "member"
          ? candidate.role
          : undefined;
      const approvalStatus =
        candidate.approvalStatus === "approved" || candidate.approvalStatus === "pending"
          ? candidate.approvalStatus
          : undefined;
      const accessStatus =
        candidate.accessStatus === "active" || candidate.accessStatus === "inactive"
          ? candidate.accessStatus
          : undefined;

      return (
        typeof candidate.username === "string" &&
        typeof candidate.passwordHash === "string" &&
        typeof candidate.salt === "string" &&
        typeof candidate.createdAt === "string" &&
        typeof (role || "member") === "string" &&
        typeof (approvalStatus || "pending") === "string" &&
        typeof (accessStatus || "active") === "string"
      );
    }).map((account, index) => {
      const isMasterLinked =
        isMasterAdminLoginIdentifier(account.username) ||
        (typeof account.email === "string" &&
          isMasterAdminLoginIdentifier(account.email)) ||
        (typeof account.phone === "string" &&
          normalizePhone(account.phone) === normalizePhone(MASTER_ADMIN_PROFILE.phone));
      const fallbackRole: AccountRole =
        (index === 0 && isMasterLinked) || isMasterLinked ? "admin" : "member";
      const role =
        account.role === "admin" || account.role === "member"
          ? account.role
          : fallbackRole;
      const approvalStatus: AccountApprovalStatus =
        account.approvalStatus === "approved" || account.approvalStatus === "pending"
          ? account.approvalStatus
          : role === "admin"
          ? "approved"
          : "pending";
      const accessStatus: AccountAccessStatus =
        account.accessStatus === "active" || account.accessStatus === "inactive"
          ? account.accessStatus
          : "active";

      return {
        ...account,
        role,
        approvalStatus,
        accessStatus,
        fullName:
          role === "admin"
            ? MASTER_ADMIN_PROFILE.fullName
            : typeof account.fullName === "string"
            ? account.fullName
            : undefined,
        email:
          role === "admin"
            ? MASTER_ADMIN_PROFILE.email
            : typeof account.email === "string"
            ? account.email
            : undefined,
        phone:
          role === "admin"
            ? MASTER_ADMIN_PROFILE.phone
            : typeof account.phone === "string"
            ? account.phone
            : undefined,
        approvedAt:
          typeof account.approvedAt === "string" ? account.approvedAt : undefined,
        approvedBy:
          typeof account.approvedBy === "string" ? account.approvedBy : undefined,
        deactivatedAt:
          typeof account.deactivatedAt === "string"
            ? account.deactivatedAt
            : undefined,
        deactivatedBy:
          typeof account.deactivatedBy === "string"
            ? account.deactivatedBy
            : undefined,
      };
    });
  } catch {
    return [];
  }
}

function readStoredSessionUsername() {
  const raw = localStorage.getItem(STORAGE_KEYS.session);
  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return "";

    const candidate = parsed as { username?: unknown };
    return typeof candidate.username === "string" ? candidate.username : "";
  } catch {
    return "";
  }
}

function readStoredRecoveryAttempt(): PasswordRecoveryAttempt | null {
  const raw = localStorage.getItem(STORAGE_KEYS.recoveryAttempt);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PasswordRecoveryAttempt>;
    if (!parsed || typeof parsed !== "object") return null;
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.createdAt !== "string" ||
      typeof parsed.username !== "string" ||
      typeof parsed.expiresAt !== "string" ||
      !Array.isArray(parsed.questions)
    ) {
      return null;
    }

    const questions = parsed.questions.filter(
      (item): item is PasswordRecoveryQuestion =>
        !!item &&
        typeof item === "object" &&
        (item.id === "q1" || item.id === "q2") &&
        typeof item.text === "string"
    );
    if (questions.length !== 2) return null;

    return {
      id: parsed.id,
      createdAt: parsed.createdAt,
      username: parsed.username,
      expiresAt: parsed.expiresAt,
      questions,
      verified: Boolean(parsed.verified),
      failedCount: Number(parsed.failedCount || 0),
      recoveryToken:
        typeof parsed.recoveryToken === "string"
          ? parsed.recoveryToken
          : undefined,
    };
  } catch {
    return null;
  }
}

function readStoredTemporaryAccessProfile(): TemporaryAccessProfile | null {
  const raw = localStorage.getItem(STORAGE_KEYS.temporaryAccessProfile);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<TemporaryAccessProfile>;
    if (!parsed || typeof parsed !== "object") return null;
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.issuedAt !== "string" ||
      typeof parsed.expiresAt !== "string" ||
      typeof parsed.reason !== "string" ||
      !Array.isArray(parsed.scopes) ||
      !Array.isArray(parsed.restrictions)
    ) {
      return null;
    }

    const expiresAtMs = Date.parse(parsed.expiresAt);
    if (!Number.isFinite(expiresAtMs) || expiresAtMs < Date.now()) {
      return null;
    }

    const scopes = parsed.scopes.filter(
      (item): item is Page =>
        item === "chat" ||
        item === "hub" ||
        item === "capabilities" ||
        item === "models"
    );

    return {
      id: parsed.id,
      issuedAt: parsed.issuedAt,
      expiresAt: parsed.expiresAt,
      reason: parsed.reason,
      scopes: scopes.length > 0 ? scopes : TEMPORARY_PROFILE_SCOPES,
      restrictions: parsed.restrictions
        .filter((item): item is string => typeof item === "string")
        .slice(0, 16),
    };
  } catch {
    return null;
  }
}

function readStoredTemporaryChangeProposals(): TemporaryChangeProposal[] {
  const raw = localStorage.getItem(STORAGE_KEYS.temporaryChangeProposals);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is TemporaryChangeProposal => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<TemporaryChangeProposal>;

      return (
        typeof candidate.id === "string" &&
        typeof candidate.createdAt === "string" &&
        typeof candidate.source === "string" &&
        (candidate.targetType === "capability" || candidate.targetType === "pack") &&
        typeof candidate.targetId === "string" &&
        typeof candidate.title === "string" &&
        typeof candidate.description === "string" &&
        (candidate.status === "pending" ||
          candidate.status === "approved" ||
          candidate.status === "rejected")
      );
    });
  } catch {
    return [];
  }
}

function readStoredOpenedSourcePreviews(): OpenedSourcePreview[] {
  const raw = localStorage.getItem(STORAGE_KEYS.openedSourcePreviews);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is OpenedSourcePreview => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<OpenedSourcePreview>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.title === "string" &&
        typeof candidate.url === "string" &&
        typeof candidate.source === "string" &&
        typeof candidate.openedAt === "string" &&
        typeof candidate.operationId === "string" &&
        (candidate.status === "opened" ||
          candidate.status === "copied" ||
          candidate.status === "queued")
      );
    });
  } catch {
    return [];
  }
}

function readStoredEngineDiagnostics(): EngineDiagnosticReport[] {
  const raw = localStorage.getItem(STORAGE_KEYS.engineDiagnostics);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is EngineDiagnosticReport => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<EngineDiagnosticReport>;
      return (
        typeof candidate.runAt === "string" &&
        typeof candidate.operationId === "string" &&
        typeof candidate.source === "string" &&
        (candidate.action === "suggest" || candidate.action === "apply") &&
        (candidate.result === "success" ||
          candidate.result === "skipped" ||
          candidate.result === "error") &&
        typeof candidate.note === "string" &&
        (typeof candidate.errorCode === "undefined" ||
          typeof candidate.errorCode === "string")
      );
    });
  } catch {
    return [];
  }
}

const DOWNLOADABLE_EXTENSIONS = new Set([
  "zip",
  "7z",
  "rar",
  "exe",
  "msi",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "csv",
  "json",
  "txt",
  "md",
  "mp3",
  "wav",
  "mp4",
  "mov",
  "mkv",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "svg",
]);

const DEFAULT_BROWSER_HOME = "https://www.koraytasan.com/";

function normalizeBrowserUrl(value: string) {
  const clean = value.trim();
  if (!clean) return "";

  try {
    const parsed = new URL(clean);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return "";
  } catch {
    try {
      const withScheme = new URL(`https://${clean}`);
      return withScheme.toString();
    } catch {
      return "";
    }
  }
}

function getUrlFileExtension(urlValue: string) {
  try {
    const parsed = new URL(urlValue);
    const name = parsed.pathname.split("/").filter(Boolean).pop() || "";
    const dotIndex = name.lastIndexOf(".");
    if (dotIndex < 1 || dotIndex === name.length - 1) return "";
    return name.slice(dotIndex + 1).toLowerCase();
  } catch {
    return "";
  }
}

function isLikelyDownloadUrl(urlValue: string) {
  const ext = getUrlFileExtension(urlValue);
  return ext ? DOWNLOADABLE_EXTENSIONS.has(ext) : false;
}

function createDefaultBrowserTab(url = DEFAULT_BROWSER_HOME): BrowserTab {
  const normalized = normalizeBrowserUrl(url) || DEFAULT_BROWSER_HOME;
  const now = new Date().toISOString();
  return {
    id: createRecordId("tab"),
    title: "Yeni sekme",
    url: normalized,
    history: [normalized],
    historyIndex: 0,
    reloadToken: 0,
    loading: true,
    createdAt: now,
    lastVisitedAt: now,
  };
}

function readStoredBrowserTabs(): BrowserTab[] {
  const raw = localStorage.getItem(STORAGE_KEYS.browserTabs);
  if (!raw) return [createDefaultBrowserTab()];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [createDefaultBrowserTab()];
    const next = parsed
      .filter((item): item is BrowserTab => {
        if (!item || typeof item !== "object") return false;
        const candidate = item as Partial<BrowserTab>;
        return (
          typeof candidate.id === "string" &&
          typeof candidate.title === "string" &&
          typeof candidate.url === "string" &&
          Array.isArray(candidate.history) &&
          typeof candidate.historyIndex === "number" &&
          typeof candidate.reloadToken === "number" &&
          typeof candidate.loading === "boolean" &&
          typeof candidate.createdAt === "string" &&
          typeof candidate.lastVisitedAt === "string"
        );
      })
      .map((item) => {
        const history = item.history
          .filter((entry) => typeof entry === "string")
          .map((entry) => normalizeBrowserUrl(entry))
          .filter(Boolean);
        const currentUrl = normalizeBrowserUrl(item.url) || history[item.historyIndex] || DEFAULT_BROWSER_HOME;
        const safeHistory = history.length > 0 ? history : [currentUrl];
        const safeIndex = Math.max(
          0,
          Math.min(item.historyIndex, safeHistory.length - 1)
        );

        return {
          ...item,
          url: currentUrl,
          history: safeHistory,
          historyIndex: safeIndex,
        };
      });
    return next.length > 0 ? next : [createDefaultBrowserTab()];
  } catch {
    return [createDefaultBrowserTab()];
  }
}

function readStoredBrowserHistory(): BrowserHistoryEntry[] {
  const raw = localStorage.getItem(STORAGE_KEYS.browserHistory);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is BrowserHistoryEntry => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<BrowserHistoryEntry>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.tabId === "string" &&
        typeof candidate.title === "string" &&
        typeof candidate.url === "string" &&
        typeof candidate.visitedAt === "string"
      );
    });
  } catch {
    return [];
  }
}

function readStoredBrowserFavorites(): BrowserFavoriteEntry[] {
  const raw = localStorage.getItem(STORAGE_KEYS.browserFavorites);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is BrowserFavoriteEntry => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<BrowserFavoriteEntry>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.title === "string" &&
        typeof candidate.url === "string" &&
        typeof candidate.createdAt === "string"
      );
    });
  } catch {
    return [];
  }
}

function readStoredDownloadQueue(): DownloadApprovalRequest[] {
  const raw = localStorage.getItem(STORAGE_KEYS.downloadQueue);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is DownloadApprovalRequest => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<DownloadApprovalRequest>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.createdAt === "string" &&
        typeof candidate.url === "string" &&
        typeof candidate.sourceDomain === "string" &&
        typeof candidate.fileName === "string" &&
        typeof candidate.extension === "string" &&
        typeof candidate.suggestedPath === "string" &&
        (candidate.status === "pending" ||
          candidate.status === "approved" ||
          candidate.status === "rejected" ||
          candidate.status === "failed" ||
          candidate.status === "completed")
      );
    });
  } catch {
    return [];
  }
}

function readStoredDownloadAudit(): DownloadAuditEntry[] {
  const raw = localStorage.getItem(STORAGE_KEYS.downloadAudit);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is DownloadAuditEntry => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<DownloadAuditEntry>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.requestId === "string" &&
        typeof candidate.at === "string" &&
        typeof candidate.sourceDomain === "string" &&
        typeof candidate.fileName === "string" &&
        typeof candidate.url === "string" &&
        typeof candidate.targetPath === "string" &&
        (candidate.result === "approved" ||
          candidate.result === "rejected" ||
          candidate.result === "completed" ||
          candidate.result === "failed") &&
        typeof candidate.note === "string"
      );
    });
  } catch {
    return [];
  }
}

async function hashPassword(username: string, password: string, salt: string) {
  const payload = new TextEncoder().encode(
    `${normalizeUsername(username)}:${salt}:${password}`
  );
  const digest = await crypto.subtle.digest("SHA-256", payload);
  return bytesToHex(new Uint8Array(digest));
}

function createSalt() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Geçersiz dosya verisi."));
    };
    reader.onerror = () => {
      reject(new Error("Dosya okunamadı."));
    };
    reader.readAsDataURL(file);
  });
}

function getStoredLicenseStatus(): LicenseStatus {
  const value = localStorage.getItem(STORAGE_KEYS.licenseStatus);

  if (
    value === "missing" ||
    value === "valid" ||
    value === "invalid" ||
    value === "restricted"
  ) {
    return value;
  }

  return "missing";
}

function formatModelSize(bytes?: number) {
  if (!bytes) return "boyut bilinmiyor";

  const gb = bytes / 1024 / 1024 / 1024;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;

  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(0)} MB`;
}

function readStoredImportedPacks(): CorePackProfile[] {
  const raw = localStorage.getItem(STORAGE_KEYS.importedPacks);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is CorePackProfile => {
      if (!item || typeof item !== "object") return false;

      const candidate = item as Partial<CorePackProfile>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.name === "string" &&
        typeof candidate.type === "string" &&
        typeof candidate.description === "string" &&
        typeof candidate.prompt === "string" &&
        candidate.source === "imported"
      );
    });
  } catch {
    return [];
  }
}

function readStoredCustomPacks(): CorePackProfile[] {
  const raw = localStorage.getItem(STORAGE_KEYS.customPacks);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is CorePackProfile => {
      if (!item || typeof item !== "object") return false;

      const candidate = item as Partial<CorePackProfile>;
      return (
        candidate.source === "custom" &&
        typeof candidate.id === "string" &&
        typeof candidate.name === "string" &&
        typeof candidate.type === "string" &&
        typeof candidate.description === "string" &&
        typeof candidate.prompt === "string"
      );
    });
  } catch {
    return [];
  }
}

function normalizeCapabilityId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readStoredCustomCapabilities(): CustomCapability[] {
  const raw = localStorage.getItem(STORAGE_KEYS.customCapabilities);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is CustomCapability => {
      if (!item || typeof item !== "object") return false;

      const candidate = item as Partial<CustomCapability>;
      return (
        candidate.isCustom === true &&
        typeof candidate.id === "string" &&
        typeof candidate.name === "string" &&
        typeof candidate.status === "string" &&
        typeof candidate.source === "string" &&
        typeof candidate.description === "string" &&
        typeof candidate.createdAt === "string"
      );
    });
  } catch {
    return [];
  }
}

function readStoredCapabilityOverrides(): Record<string, CapabilityOverride> {
  const raw = localStorage.getItem(STORAGE_KEYS.capabilityOverrides);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const entries = Object.entries(parsed as Record<string, unknown>);
    return entries.reduce<Record<string, CapabilityOverride>>((acc, [key, value]) => {
      if (!value || typeof value !== "object") {
        return acc;
      }

      const candidate = value as Partial<CapabilityOverride>;
      if (
        typeof candidate.updatedAt !== "string" &&
        typeof candidate.updatedAt !== "undefined"
      ) {
        return acc;
      }

      acc[key] = {
        name: typeof candidate.name === "string" ? candidate.name : undefined,
        description:
          typeof candidate.description === "string"
            ? candidate.description
            : undefined,
        isArchived:
          typeof candidate.isArchived === "boolean" ? candidate.isArchived : false,
        isPaused:
          typeof candidate.isPaused === "boolean" ? candidate.isPaused : false,
        updatedAt:
          typeof candidate.updatedAt === "string"
            ? candidate.updatedAt
            : new Date().toISOString(),
      };
      return acc;
    }, {});
  } catch {
    return {};
  }
}

function readStoredCapabilityOrder() {
  const raw = localStorage.getItem(STORAGE_KEYS.capabilityOrder);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function readStoredCapabilityLibraryPool(): CapabilityLibrarySuggestion[] {
  const raw = localStorage.getItem(STORAGE_KEYS.capabilityLibraryPool);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is CapabilityLibrarySuggestion => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<CapabilityLibrarySuggestion>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.capabilityId === "string" &&
        typeof candidate.capabilityName === "string" &&
        typeof candidate.libraryName === "string" &&
        (candidate.ecosystem === "npm" ||
          candidate.ecosystem === "github" ||
          candidate.ecosystem === "docs") &&
        typeof candidate.reason === "string" &&
        typeof candidate.sourceUrl === "string" &&
        typeof candidate.createdAt === "string"
      );
    });
  } catch {
    return [];
  }
}

function readStoredCapabilityLibraryPending(): CapabilityLibrarySuggestion[] {
  const raw = localStorage.getItem(STORAGE_KEYS.capabilityLibraryPending);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is CapabilityLibrarySuggestion => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<CapabilityLibrarySuggestion>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.capabilityId === "string" &&
        typeof candidate.capabilityName === "string" &&
        typeof candidate.libraryName === "string" &&
        (candidate.ecosystem === "npm" ||
          candidate.ecosystem === "github" ||
          candidate.ecosystem === "docs") &&
        typeof candidate.reason === "string" &&
        typeof candidate.sourceUrl === "string" &&
        typeof candidate.createdAt === "string"
      );
    });
  } catch {
    return [];
  }
}

function readStoredUpgradeStageOrder() {
  const raw = localStorage.getItem(STORAGE_KEYS.upgradeStageOrder);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function titleCaseTr(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => {
      if (!word) return word;
      return (
        word.slice(0, 1).toLocaleUpperCase("tr-TR") +
        word.slice(1).toLocaleLowerCase("tr-TR")
      );
    })
    .join(" ");
}

function sentenceCaseTr(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return "";

  return (
    normalized.slice(0, 1).toLocaleUpperCase("tr-TR") +
    normalized.slice(1).toLocaleLowerCase("tr-TR")
  );
}

function normalizeCapabilityDisplay(
  name: string,
  description: string
) {
  const cleanName = titleCaseTr(name);
  const cleanDescription = sentenceCaseTr(description);

  return {
    name: cleanName,
    description: cleanDescription,
  };
}

function buildCapabilitySearchQuery(capability: CapabilityCard) {
  const name = capability.name.trim();
  const description = capability.description.trim();
  const context = [name, description]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return context || name || "OC capability";
}

function buildCapabilityResearchLinks(
  capability: CapabilityCard
): CapabilityResearchLink[] {
  const query = buildCapabilitySearchQuery(capability);
  const githubQuery = `${query} repository library`;
  const npmQuery = `${query} package`;
  const docsQuery = `${query} documentation`;
  const githubUrl = `https://github.com/search?q=${encodeURIComponent(
    githubQuery
  )}&type=repositories`;
  const npmUrl = `https://www.npmjs.com/search?q=${encodeURIComponent(npmQuery)}`;
  const docsUrl = `https://www.google.com/search?q=${encodeURIComponent(
    docsQuery
  )}`;

  return [
    {
      label: "GitHub kaynak ara",
      description: "İlgili repo, örnek uygulama ve helper kütüphaneleri tara.",
      url: githubUrl,
    },
    {
      label: "npm paket ara",
      description: "UI ve entegrasyon için uygun paketleri bul.",
      url: npmUrl,
    },
    {
      label: "Doküman ara",
      description: "Resmî doküman ve kullanım örneklerini incele.",
      url: docsUrl,
    },
  ];
}

function buildCapabilityLibrarySuggestions(
  capability: CapabilityCard
): CapabilityLibrarySuggestion[] {
  const text = `${capability.name} ${capability.description}`.toLocaleLowerCase("tr-TR");
  const now = new Date().toISOString();
  const list: CapabilityLibrarySuggestion[] = [];

  function pushUnique(
    libraryName: string,
    ecosystem: "npm" | "github" | "docs",
    reason: string,
    sourceUrl: string
  ) {
    if (list.some((item) => item.libraryName === libraryName)) return;
    list.push({
      id: createRecordId("lib"),
      capabilityId: capability.id,
      capabilityName: capability.name,
      libraryName,
      ecosystem,
      reason,
      sourceUrl,
      createdAt: now,
    });
  }

  if (/kod|geliştirici|repo|git|program|api|otomasyon/.test(text)) {
    pushUnique(
      "simple-git",
      "npm",
      "Git tabanlı otomasyonlar ve yerel depo işlemleri için hafif bir katman.",
      "https://www.npmjs.com/package/simple-git"
    );
    pushUnique(
      "octokit",
      "npm",
      "GitHub API entegrasyonu ve kaynak tarama akışı için resmi istemci.",
      "https://www.npmjs.com/package/octokit"
    );
  }

  if (/görsel|ocr|resim|image|foto|video/.test(text)) {
    pushUnique(
      "sharp",
      "npm",
      "Görsel işleme, dönüştürme ve çıktı optimizasyonu için güçlü altyapı.",
      "https://www.npmjs.com/package/sharp"
    );
    pushUnique(
      "tesseract.js",
      "npm",
      "OCR tabanlı metin çıkarımı ve belge analizi için uygun seçenek.",
      "https://www.npmjs.com/package/tesseract.js"
    );
  }

  if (/ses|konuşma|speech|stt|audio/.test(text)) {
    pushUnique(
      "whisper.cpp",
      "github",
      "Yerel konuşma-metin (STT) denemeleri için güçlü açık kaynak altyapı.",
      "https://github.com/ggerganov/whisper.cpp"
    );
    pushUnique(
      "node-record-lpcm16",
      "npm",
      "Canlı ses girişi akışı ve kayıt pipeline denemeleri için pratik araç.",
      "https://www.npmjs.com/package/node-record-lpcm16"
    );
  }

  if (
    /kuantum|quantum|matematik|math|cebir|algebra|kimya|chem|molekül|molecule|bilim|science|akademik/.test(
      text
    )
  ) {
    scientificLibraryCatalog.forEach((item) => {
      pushUnique(
        item.libraryName,
        item.ecosystem,
        `${item.reason} Kullanım: ${item.useCase}`,
        item.sourceUrl
      );
    });
  }

  if (list.length === 0) {
    const query = encodeURIComponent(`${capability.name} ${capability.description} npm github`);
    pushUnique(
      `${capability.name} toolkit`,
      "docs",
      "Yetenek için genel kaynak tarama sonucu; önce dokümantasyon ve örnekleri gözden geçir.",
      `https://www.google.com/search?q=${query}`
    );
  }

  return list;
}

function normalizePackId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveUniquePackId(baseId: string, usedIds: Set<string>) {
  let nextId = baseId;
  let suffix = 2;

  while (usedIds.has(nextId)) {
    nextId = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return nextId;
}

function normalizeManifestStringField(value: unknown, fieldName: string) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new Error(`MANIFEST_INVALID_SCHEMA:${fieldName}`);
  }
  const clean = value.trim();
  if (!clean) {
    throw new Error(`MANIFEST_INVALID_SCHEMA:${fieldName}`);
  }
  return clean;
}

function sanitizeCorePackEntryPath(entryPath: string) {
  const clean = entryPath.trim().replace(/\\/g, "/");
  if (!clean) return null;
  if (clean.startsWith("/") || /^[a-zA-Z]:/.test(clean)) return null;
  if (clean.includes("\0")) return null;

  const normalized = clean
    .replace(/^[./]+/, "")
    .replace(/\/{2,}/g, "/");

  if (!normalized) return null;

  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  if (segments.some((segment) => segment === "." || segment === "..")) return null;

  return segments.join("/");
}

function validateCorePackManifest(manifestValue: unknown): CorePackManifest {
  if (!manifestValue || typeof manifestValue !== "object" || Array.isArray(manifestValue)) {
    throw new Error("MANIFEST_INVALID_SCHEMA");
  }

  const candidate = manifestValue as Record<string, unknown>;
  const manifest: CorePackManifest = {};

  manifest.id = normalizeManifestStringField(candidate.id, "id");
  manifest.name = normalizeManifestStringField(candidate.name, "name");
  manifest.type = normalizeManifestStringField(candidate.type, "type");
  manifest.description = normalizeManifestStringField(candidate.description, "description");
  manifest.entryPrompt = normalizeManifestStringField(candidate.entryPrompt, "entryPrompt");
  manifest.version = normalizeManifestStringField(candidate.version, "version");
  manifest.minCoreVersion = normalizeManifestStringField(
    candidate.minCoreVersion,
    "minCoreVersion"
  );

  if (candidate.offline !== undefined && typeof candidate.offline !== "boolean") {
    throw new Error("MANIFEST_INVALID_SCHEMA:offline");
  }
  manifest.offline = candidate.offline as boolean | undefined;

  if (candidate.permissions !== undefined) {
    if (!Array.isArray(candidate.permissions)) {
      throw new Error("MANIFEST_INVALID_SCHEMA:permissions");
    }

    const permissions = candidate.permissions
      .map((entry) => {
        if (typeof entry !== "string") {
          throw new Error("MANIFEST_INVALID_SCHEMA:permissions");
        }
        const clean = entry.trim();
        if (!clean) {
          throw new Error("MANIFEST_INVALID_SCHEMA:permissions");
        }
        return clean;
      })
      .filter(Boolean);

    manifest.permissions = permissions;
  }

  return manifest;
}

function findZipFileEntry(zip: JSZip, targetPath: string) {
  const normalizedTarget = targetPath
    .replace(/^[./\\]+/, "")
    .replace(/\\/g, "/")
    .toLowerCase();

  const fileEntries = Object.values(zip.files).filter((entry) => !entry.dir);

  const exact = fileEntries.find(
    (entry) => entry.name.toLowerCase() === normalizedTarget
  );
  if (exact) return exact;

  return (
    fileEntries.find((entry) =>
      entry.name.toLowerCase().endsWith(`/${normalizedTarget}`)
    ) || null
  );
}

async function requestOllamaModels() {
  const response = await fetch("http://localhost:11434/api/tags");

  if (!response.ok) {
    throw new Error("OLLAMA_OFFLINE");
  }

  const data = await response.json();
  return Array.isArray(data.models) ? (data.models as OllamaModel[]) : [];
}

function getStoredRepositorySource(): RepositorySource {
  const value = localStorage.getItem(STORAGE_KEYS.repoSource);
  return value === "gitlab" ? "gitlab" : "github";
}

function buildRepositoryFileUrl(
  source: RepositorySource,
  repoUrl: string,
  filePath: string,
  ref: string
) {
  const cleanRepoUrl = repoUrl.trim().replace(/\/+$/, "");
  const cleanFilePath = filePath.trim().replace(/^\/+/, "");
  const cleanRef = ref.trim();

  if (!cleanRepoUrl || !cleanFilePath) {
    throw new Error("REPO_INPUT_REQUIRED");
  }

  try {
    const parsed = new URL(cleanRepoUrl);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.replace(/\/+$/, "");

    if (source === "github") {
      if (host === "raw.githubusercontent.com") {
        return parsed.toString();
      }

      if (host === "github.com") {
        const parts = path.split("/").filter(Boolean);
        const blobIndex = parts.indexOf("blob");

        if (parts.length >= 4 && blobIndex >= 2) {
          const owner = parts[0];
          const repo = parts[1];
          const branch = parts[blobIndex + 1];
          const fileParts = parts.slice(blobIndex + 2);
          return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${fileParts.join("/")}`;
        }
      }
    }

    if (source === "gitlab") {
      if (host === "gitlab.com" && path.includes("/-/raw/")) {
        return parsed.toString();
      }

      if (host === "gitlab.com" && path.includes("/-/blob/")) {
        return parsed.toString().replace("/-/blob/", "/-/raw/");
      }
    }
  } catch {
    // Treat as shorthand repo URL below.
  }

  if (source === "github") {
    if (cleanRepoUrl.includes("github.com")) {
      try {
        const parsed = new URL(cleanRepoUrl);
        const parts = parsed.pathname.split("/").filter(Boolean);

        if (parts.length >= 2) {
          const [owner, repo] = parts;
          return `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(
            cleanRef
          )}/${cleanFilePath}`;
        }
      } catch {
        // fall through to the generic raw URL below
      }

      const normalized = cleanRepoUrl.replace(/\/+$/, "");
      return `${normalized}/raw/${encodeURIComponent(cleanRef)}/${cleanFilePath}`;
    }

    return `https://raw.githubusercontent.com/${cleanRepoUrl}/${encodeURIComponent(
      cleanRef
    )}/${cleanFilePath}`;
  }

  if (cleanRepoUrl.includes("gitlab.com")) {
    const normalized = cleanRepoUrl.replace(/\/+$/, "");
    return `${normalized}/-/raw/${encodeURIComponent(cleanRef)}/${cleanFilePath}`;
  }

  return `${cleanRepoUrl}/${cleanFilePath}`;
}

async function requestRepositoryFile(
  source: RepositorySource,
  repoUrl: string,
  filePath: string,
  ref: string
) {
  const targetUrl = buildRepositoryFileUrl(source, repoUrl, filePath, ref);
  const response = await fetch(targetUrl);

  if (!response.ok) {
    throw new Error(`REPO_FETCH_${response.status}`);
  }

  return {
    url: targetUrl,
    content: await response.text(),
  };
}

function buildGithubRepositorySearchUrl(query: string) {
  return `https://github.com/search?q=${encodeURIComponent(query)}&type=repositories`;
}

function normalizePackageTargetName(value: string) {
  const clean = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  return clean || "github-package";
}

function suggestPackageNameFromRepoUrl(value: string) {
  const clean = value.trim().replace(/\/+$/, "");
  if (!clean) return "";

  const shorthandMatch = clean.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\.git)?$/);
  if (shorthandMatch) {
    const owner = shorthandMatch[1];
    const repo = shorthandMatch[2].replace(/\.git$/i, "");
    return normalizePackageTargetName(`${owner}-${repo}`);
  }

  const urlMatch = clean.match(
    /github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?(?:[/?#].*)?$/i
  );
  if (!urlMatch) return "";

  const owner = urlMatch[1];
  const repo = urlMatch[2].replace(/\.git$/i, "");
  return normalizePackageTargetName(`${owner}-${repo}`);
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function buildChatMemoryTopicTitle(content: string) {
  const normalized = normalizeWhitespace(content);
  if (!normalized) return "Başlıksız not";
  if (normalized.length <= 72) return normalized;
  const shortened = normalized.slice(0, 72);
  const lastSpace = shortened.lastIndexOf(" ");
  const base = lastSpace > 24 ? shortened.slice(0, lastSpace) : shortened;
  return `${base}...`;
}

function buildChatMemoryTopicKey(content: string) {
  const normalized = normalizeWhitespace(content).toLocaleLowerCase("tr-TR");
  const plain = normalized.replace(/[^a-z0-9çğıöşü\s]/gi, " ");
  const stopWords = new Set([
    "ve",
    "ile",
    "için",
    "ama",
    "fakat",
    "ya",
    "veya",
    "gibi",
    "bir",
    "bu",
    "şu",
    "o",
    "da",
    "de",
    "mi",
    "mu",
    "mı",
    "mü",
  ]);
  const words = plain
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 2 && !stopWords.has(item));
  const basis = (words.length > 0 ? words : plain.split(/\s+/).filter(Boolean)).slice(0, 5);
  return basis.join(" ");
}

function splitPersonaTraits(text: string) {
  const normalized = text.toLowerCase();
  const traits: string[] = [];

  const buckets: Array<[string, string]> = [
    ["video", "Video ritmi"],
    ["kurgu", "Kurgu dili"],
    ["montaj", "Montaj sezgisi"],
    ["hikaye", "Hikâye odağı"],
    ["hikâye", "Hikâye odağı"],
    ["yapay zeka", "Yerel AI merakı"],
    ["yapay zekâ", "Yerel AI merakı"],
    ["ai", "AI üretim refleksi"],
    ["eğit", "Öğretici yaklaşım"],
    ["ogret", "Öğretici yaklaşım"],
    ["marka", "Marka duyarlılığı"],
    ["ritim", "Ritim hissi"],
    ["teknoloji", "Teknoloji merakı"],
    ["gizlilik", "Şeffaflık ve gizlilik"],
    ["yerel", "Yerel-first bakış"],
  ];

  for (const [needle, label] of buckets) {
    if (normalized.includes(needle) && !traits.includes(label)) {
      traits.push(label);
    }
  }

  if (traits.length === 0) {
    traits.push("Üretim odaklı");
  }

  return traits.slice(0, 6);
}

function buildPersonaAdditions({
  learningFromUser,
  creativeStyleLearning,
  trendAwareReplies,
}: {
  learningFromUser: boolean;
  creativeStyleLearning: boolean;
  trendAwareReplies: boolean;
}) {
  return [
    "Koray'ın görüntü, hikâye ve üretim ritmine uyum sağlayan bir ses kullanırım.",
    "Yerel-first yaklaşımı korur, açık sınırlı modda gerçeği saklamam.",
    learningFromUser
      ? "Kullanıcı tercihlerini saklar, tekrar eden anlatı ve üretim tercihlerini sonraki yanıtlara taşırım."
      : "Kullanıcı öğrenmesi kapalıysa kalıcı tercih çıkarımı yapmam.",
    creativeStyleLearning
      ? "Görsel, sahne ve stil kararlarında kullanıcının estetik dilini takip ederim."
      : "Yaratıcı stil öğrenmesi kapalıysa stil önerilerini geçici ve dikkatli tutarım.",
    trendAwareReplies
      ? "Trendleri araştırmam gerektiğinde bunu açıkça belirtir ve uydurma araştırma yapmam."
      : "Trend farkındalığı kapalıysa yalnızca yerel bağlama dayanırım.",
    "Yetenek, paket ve persona eklemelerini somut önerilere çeviririm.",
  ];
}

function createPersonaAvatarDataUrl(name: string, headline: string) {
  const escapeXml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const initials = normalizeWhitespace(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  const safeHeadline = escapeXml(headline);
  const safeInitials = initials || "KT";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <defs>
        <radialGradient id="bg" cx="28%" cy="18%" r="85%">
          <stop offset="0%" stop-color="#6d5438"/>
          <stop offset="40%" stop-color="#2e2926"/>
          <stop offset="100%" stop-color="#11100f"/>
        </radialGradient>
        <radialGradient id="skin" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stop-color="#efc1a1"/>
          <stop offset="100%" stop-color="#9c6b50"/>
        </radialGradient>
        <linearGradient id="hair" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1b1715"/>
          <stop offset="100%" stop-color="#3c312d"/>
        </linearGradient>
        <linearGradient id="blazer" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#131211"/>
          <stop offset="100%" stop-color="#1f1d1b"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="18" stdDeviation="14" flood-opacity="0.38"/>
        </filter>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.8"/>
        </filter>
      </defs>
      <rect width="512" height="512" fill="url(#bg)"/>
      <circle cx="256" cy="242" r="145" fill="url(#skin)" opacity="0.18" filter="url(#soft)"/>
      <path d="M112 430c26-67 81-108 144-108s118 41 144 108v46H112z" fill="url(#blazer)"/>
      <path d="M160 215c0-75 43-127 96-127s96 52 96 127c0 72-43 120-96 120s-96-48-96-120z" fill="url(#skin)" filter="url(#shadow)"/>
      <path d="M159 188c8-48 38-83 97-83 56 0 90 35 100 82 2 12-6 23-18 24l-159 1c-13 0-23-11-20-24z" fill="url(#hair)"/>
      <path d="M174 206c7-34 29-69 82-69 54 0 78 35 84 70 1 6-4 11-10 11H184c-7 0-12-6-10-12z" fill="#141210" opacity="0.78"/>
      <ellipse cx="223" cy="244" rx="17" ry="11" fill="#111"/>
      <ellipse cx="289" cy="244" rx="17" ry="11" fill="#111"/>
      <path d="M223 248c8-10 16-16 33-16s25 6 33 16" stroke="#5a3a2b" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.35"/>
      <path d="M252 247c-2 19-3 28-12 40" stroke="#754f3d" stroke-width="7" stroke-linecap="round" fill="none" opacity="0.5"/>
      <path d="M213 286c14 11 26 16 43 16s30-5 44-16" stroke="#5e4032" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.75"/>
      <path d="M175 334c25-18 47-27 81-27 35 0 58 9 81 27" stroke="#1a1716" stroke-width="34" stroke-linecap="round" fill="none" opacity="0.9"/>
      <circle cx="256" cy="430" r="160" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="3"/>
      <g transform="translate(338 76)">
        <rect x="0" y="0" width="140" height="58" rx="15" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.18)"/>
        <text x="14" y="24" fill="#f4f0e8" font-size="12" font-family="Inter, Arial, sans-serif" font-weight="700">${safeInitials}</text>
        <text x="14" y="42" fill="#d9cdbd" font-size="8" font-family="Inter, Arial, sans-serif">${safeHeadline}</text>
      </g>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildPersonaProfile({
  name,
  headline,
  bio,
  avatarDataUrl,
  learningFromUser,
  creativeStyleLearning,
  trendAwareReplies,
}: {
  name: string;
  headline: string;
  bio: string;
  avatarDataUrl?: string;
  learningFromUser: boolean;
  creativeStyleLearning: boolean;
  trendAwareReplies: boolean;
}): PersonaProfile {
  const cleanName = normalizeWhitespace(name) || defaultMasterPersonaName;
  const cleanHeadline = normalizeWhitespace(headline) || defaultMasterPersonaHeadline;
  const cleanBio = normalizeWhitespace(bio) || defaultMasterPersonaBio;
  const summary = cleanBio.slice(0, 220) + (cleanBio.length > 220 ? "..." : "");

  return {
    name: cleanName,
    headline: cleanHeadline,
    bio: cleanBio,
    summary,
    traits: splitPersonaTraits(`${cleanHeadline} ${cleanBio}`),
    additions: buildPersonaAdditions({
      learningFromUser,
      creativeStyleLearning,
      trendAwareReplies,
    }),
    avatarDataUrl:
      normalizeWhitespace(avatarDataUrl || "") ||
      "/persona-avatar.png",
  };
}

function buildUpgradeEngineReport({
  isLicensed,
  ollamaStatus,
  model,
  availableModels,
  activePack,
  learningFromUser,
  creativeStyleLearning,
  trendAwareReplies,
  capabilityDevelopment,
  personaProfile,
}: {
  isLicensed: boolean;
  ollamaStatus: OllamaStatus;
  model: string;
  availableModels: OllamaModel[];
  activePack: CorePackProfile | null;
  learningFromUser: boolean;
  creativeStyleLearning: boolean;
  trendAwareReplies: boolean;
  capabilityDevelopment: boolean;
  personaProfile: PersonaProfile;
}): UpgradeEngineReport {
  const ready: string[] = [];
  const gaps: string[] = [];
  const nextSteps: string[] = [];

  if (isLicensed) ready.push("Lisans gate açık");
  else gaps.push("Lisans geçersiz ya da eksik");

  if (ollamaStatus === "online") ready.push("Ollama bağlantısı hazır");
  else gaps.push("Ollama bağlantısını doğrula");

  if (availableModels.some((item) => item.name === model)) {
    ready.push(`Seçili model yüklü: ${model}`);
  } else {
    gaps.push("Seçili model cihazda bulunmuyor");
    nextSteps.push(`Terminalde ollama pull ${model}`);
  }

  if (activePack) ready.push(`Aktif paket: ${activePack.name}`);
  else gaps.push("Aktif paket yok");

  if (capabilityDevelopment) ready.push("Yetenek geliştirme açık");
  else gaps.push("Yetenek geliştirme kapalı");

  if (learningFromUser) ready.push("Kullanıcıdan öğrenme açık");
  if (creativeStyleLearning) ready.push("Yaratıcı stil öğrenme açık");
  if (trendAwareReplies) ready.push("Trend farkındalığı açık");

  ready.push(`Persona hazır: ${personaProfile.name}`);

  if (!learningFromUser || !creativeStyleLearning || !trendAwareReplies) {
    nextSteps.push(
      "Motor notu: Admin isterse Ayarlar'da öğrenme anahtarlarını manuel güncelleyebilir; motor bu ayarları otomatik değiştirmez."
    );
    nextSteps.push(
      "Yetenek akışında GitHub kaynak araştırmasını çalıştır ve uygun kütüphaneleri onayla ekle."
    );
  }
  if (!capabilityDevelopment) {
    nextSteps.push(
      "Motor notu: Admin isterse Ayarlar > Yetenek geliştirme ayarını manuel açabilir; motor bu ayarı otomatik değiştirmez."
    );
    nextSteps.push(
      "Yetenek kartlarında Geliştir akışıyla GitHub araştırması başlat ve onaylı önerileri havuza ekle."
    );
  }
  if (!activePack) {
    nextSteps.push("Paketler'den bir corepack aktif et");
  }
  if (ollamaStatus !== "online") {
    nextSteps.push("Modeller ekranından Ollama bağlantısını kontrol et");
  }

  const focus = !isLicensed
    ? "Önce lisans gate ve açık sınırlı mod"
    : ollamaStatus !== "online"
    ? "Önce Ollama bağlantısı"
    : !availableModels.some((item) => item.name === model)
    ? "Önce model indirme"
    : !activePack
    ? "Önce aktif paket"
    : !capabilityDevelopment
    ? "Önce yetenek geliştirme"
    : "Persona + multimodal hazırlık";

  const summary = [
    `Motor ${isLicensed ? "lisans açısından hazır" : "lisans açısından sınırlı"}.`,
    `Ollama durumu: ${ollamaStatus === "online" ? "bağlı" : "hazır değil"}.`,
    `Merkez persona: ${personaProfile.name}.`,
  ].join(" ");

  if (nextSteps.length === 0) {
    nextSteps.push(
      "Şimdiki çekirdek yeterli; yetenek geliştirme için GitHub araştırmasıyla onaylı kütüphane eklemeye devam et."
    );
  }

  return {
    runAt: new Date().toISOString(),
    focus,
    summary,
    ready,
    gaps,
    nextSteps,
  };
}

function buildContinuationPlan({
  isLicensed,
  ollamaStatus,
  model,
  availableModels,
  activePack,
  capabilityDevelopment,
  upgradeEngineReport,
  personaProfile,
  continuationMode,
}: {
  isLicensed: boolean;
  ollamaStatus: OllamaStatus;
  model: string;
  availableModels: OllamaModel[];
  activePack: CorePackProfile | null;
  capabilityDevelopment: boolean;
  upgradeEngineReport: UpgradeEngineReport | null;
  personaProfile: PersonaProfile;
  continuationMode: boolean;
}): ContinuationPlan {
  const carryForward = [
    `Persona: ${personaProfile.name}`,
    `Dil: kullanıcının dili`,
    `Model: ${model}`,
    `Paket: ${activePack ? activePack.name : "Yok"}`,
    `Lisans: ${isLicensed ? "Geçerli" : "Sınırlı"}`,
  ];

  const nextSteps: string[] = [];
  let nextPage: Page = "hub";
  let nextHubTab: HubTab = "capabilities";
  let nextPageLabel = "Yetenekler";
  let focus = "Devam planı hazır";

  if (!isLicensed) {
    nextPage = "license";
    nextPageLabel = "Lisans";
    focus = "Önce lisans gate'i tamamla";
    nextSteps.push("EULA ve gizlilik kabulünü kontrol et.");
    nextSteps.push("Geçerli token gir veya dev lisansı kullan.");
  } else if (ollamaStatus !== "online") {
    nextPage = "hub";
    nextHubTab = "models";
    nextPageLabel = "Modeller";
    focus = "Önce Ollama bağlantısını doğrula";
    nextSteps.push("Ollama servisini başlat.");
    nextSteps.push("Yüklü model listesi gelmiyorsa terminalden `ollama pull` çalıştır.");
  } else if (!availableModels.some((item) => item.name === model)) {
    nextPage = "hub";
    nextHubTab = "models";
    nextPageLabel = "Modeller";
    focus = "Seçili model makinede yok";
    nextSteps.push(`Terminalde \`ollama pull ${model}\` çalıştır.`);
    nextSteps.push("İndirme bittikten sonra modeli seç ve testi yeniden yap.");
  } else if (!activePack) {
    nextPage = "hub";
    nextHubTab = "packs";
    nextPageLabel = "Paketler";
    focus = "Bir aktif paketle karakteri sabitle";
    nextSteps.push("Uygun .corepack paketini seç.");
    nextSteps.push("Gerekirse yeni bir paket içe aktar.");
  } else if (!capabilityDevelopment) {
    nextPage = "hub";
    nextHubTab = "capabilities";
    nextPageLabel = "Yetenekler";
    focus = "Yetenek geliştirme akışını başlat";
    nextSteps.push(
      "Admin isterse Ayarlar > Yetenek geliştirme anahtarını manuel açabilir."
    );
    nextSteps.push("Motor ayarları otomatik değiştirmez; yalnızca öneri verir.");
    nextSteps.push("Yetenekler ekranındaki kartlardan Geliştir akışını başlat.");
    nextSteps.push("GitHub kaynak araştırmasından gelen önerileri onayla ve havuza ekle.");
  } else if (!upgradeEngineReport) {
    nextPage = "hub";
    nextHubTab = "upgrades";
    nextPageLabel = "Yükseltmeler";
    focus = "Yükseltme motorunu ilk kez çalıştır";
    nextSteps.push("Persona ve çekirdek durumunu raporla.");
    nextSteps.push("Hazır olan sıradaki multimodal alanı seç.");
  } else if (upgradeEngineReport.gaps.length > 0) {
    nextPage = "hub";
    nextHubTab = "upgrades";
    nextPageLabel = "Yükseltmeler";
    focus = "Kalan boşlukları kapat";
    nextSteps.push(...upgradeEngineReport.nextSteps.slice(0, 3));
  } else {
    nextPage = "hub";
    nextHubTab = "coding";
    nextPageLabel = "Kodlama";
    focus = "Çekirdek hazır, üretim alanını genişlet";
    nextSteps.push("Kodlama modeliyle GitHub kaynaklarını tara.");
    nextSteps.push("Depo bağlantısı üzerinden ilgili dosyaları çek.");
    nextSteps.push("Gerekirse yeni capability ve paketler tasarla.");
  }

  if (continuationMode) {
    nextSteps.unshift("Bu plan otomatik devam için canlı tutuluyor.");
  } else {
    nextSteps.unshift("Bu plan elle onayla devam etmek için hazır.");
  }

  const handoff = [
    `Şu anki durum: ${focus}.`,
    `Bir sonraki güvenli adım: ${nextPageLabel}.`,
    `OC bu aşamada kendi başına ilerlemek yerine, açık bir handoff üretir.`,
  ].join(" ");

  return {
    runAt: new Date().toISOString(),
    mode: continuationMode ? "guided" : "manual",
    focus,
    handoff,
    nextPage,
    nextHubTab,
    nextPageLabel,
    nextSteps,
    carryForward,
  };
}

function readStoredUpgradeEngineReport() {
  const raw = localStorage.getItem(STORAGE_KEYS.upgradeEngineReport);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;

    const candidate = parsed as Partial<UpgradeEngineReport>;
    if (
      typeof candidate.runAt !== "string" ||
      typeof candidate.focus !== "string" ||
      typeof candidate.summary !== "string" ||
      !Array.isArray(candidate.ready) ||
      !Array.isArray(candidate.gaps) ||
      !Array.isArray(candidate.nextSteps)
    ) {
      return null;
    }

    return {
      runAt: candidate.runAt,
      focus: candidate.focus,
      summary: candidate.summary,
      ready: candidate.ready.filter((item): item is string => typeof item === "string"),
      gaps: candidate.gaps.filter((item): item is string => typeof item === "string"),
      nextSteps: candidate.nextSteps.filter((item): item is string => typeof item === "string"),
    };
  } catch {
    return null;
  }
}

function readStoredContinuationPlan() {
  const raw = localStorage.getItem(STORAGE_KEYS.continuationPlan);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;

    const candidate = parsed as Partial<ContinuationPlan>;
    const validPages: Page[] = [
      "chat",
      "terminal",
      "hub",
      "persona",
      "license",
      "settings",
    ];

    if (
      typeof candidate.runAt !== "string" ||
      (candidate.mode !== "manual" && candidate.mode !== "guided") ||
      typeof candidate.focus !== "string" ||
      typeof candidate.handoff !== "string" ||
      !candidate.nextPage ||
      !validPages.includes(candidate.nextPage) ||
      (candidate.nextPage === "hub" && !isHubTab(candidate.nextHubTab)) ||
      typeof candidate.nextPageLabel !== "string" ||
      !Array.isArray(candidate.nextSteps) ||
      !Array.isArray(candidate.carryForward)
    ) {
      return null;
    }

    return {
      runAt: candidate.runAt,
      mode: candidate.mode,
      focus: candidate.focus,
      handoff: candidate.handoff,
      nextPage: candidate.nextPage,
      nextHubTab: candidate.nextPage === "hub" ? candidate.nextHubTab : undefined,
      nextPageLabel: candidate.nextPageLabel,
      nextSteps: candidate.nextSteps.filter((item): item is string => typeof item === "string"),
      carryForward: candidate.carryForward.filter(
        (item): item is string => typeof item === "string"
      ),
    };
  } catch {
    return null;
  }
}

function readStoredActivityLog(): ActivityLogEntry[] {
  const raw = localStorage.getItem(STORAGE_KEYS.activityLog);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is ActivityLogEntry => {
      if (!item || typeof item !== "object") return false;

      const candidate = item as Partial<ActivityLogEntry>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.at === "string" &&
        typeof candidate.message === "string" &&
        (candidate.tone === "info" ||
          candidate.tone === "success" ||
          candidate.tone === "warn" ||
          candidate.tone === "error")
      );
    });
  } catch {
    return [];
  }
}

function readStoredTerminalHistory(): TerminalRunEntry[] {
  const raw = localStorage.getItem(STORAGE_KEYS.terminalHistory);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is TerminalRunEntry => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<TerminalRunEntry>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.at === "string" &&
        typeof candidate.command === "string" &&
        typeof candidate.stdout === "string" &&
        typeof candidate.stderr === "string" &&
        typeof candidate.statusCode === "number"
      );
    });
  } catch {
    return [];
  }
}

function readStoredShareLinkSessions(): ShareLinkSession[] {
  const raw = localStorage.getItem(STORAGE_KEYS.shareLinkSessions);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item): ShareLinkSession | null => {
        if (!item || typeof item !== "object") return null;
        const candidate = item as Partial<ShareLinkSession>;
        const isValidStatus =
          candidate.status === "active" ||
          candidate.status === "completed" ||
          candidate.status === "revoked" ||
          candidate.status === "expired";

        if (
          typeof candidate.id !== "string" ||
          typeof candidate.createdAt !== "string" ||
          typeof candidate.createdBy !== "string" ||
          typeof candidate.recipientLabel !== "string" ||
          typeof candidate.topic !== "string" ||
          typeof candidate.instruction !== "string" ||
          typeof candidate.maxMessages !== "number" ||
          typeof candidate.expiresAt !== "string" ||
          !isValidStatus ||
          typeof candidate.url !== "string"
        ) {
          return null;
        }

        const transcript = Array.isArray(candidate.transcript)
          ? candidate.transcript.filter(
              (message): message is Message =>
                Boolean(message) &&
                typeof message === "object" &&
                ((message as Message).role === "user" ||
                  (message as Message).role === "assistant") &&
                typeof (message as Message).content === "string"
            )
          : [];

        return {
          id: candidate.id,
          createdAt: candidate.createdAt,
          createdBy: candidate.createdBy,
          recipientLabel: candidate.recipientLabel,
          topic: candidate.topic,
          instruction: candidate.instruction,
          maxMessages: candidate.maxMessages,
          expiresAt: candidate.expiresAt,
          status: candidate.status as ShareLinkSessionStatus,
          url: candidate.url,
          guestDisplayName:
            typeof candidate.guestDisplayName === "string"
              ? candidate.guestDisplayName
              : undefined,
          completedAt:
            typeof candidate.completedAt === "string"
              ? candidate.completedAt
              : undefined,
          lastMessageAt:
            typeof candidate.lastMessageAt === "string"
              ? candidate.lastMessageAt
              : undefined,
          transcript,
        };
      })
      .filter((item): item is ShareLinkSession => Boolean(item));
  } catch {
    return [];
  }
}

function readStoredExternalConversations(): ExternalConversationRecord[] {
  const raw = localStorage.getItem(STORAGE_KEYS.externalConversations);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item): ExternalConversationRecord | null => {
        if (!item || typeof item !== "object") return null;
        const candidate = item as Partial<ExternalConversationRecord>;
        const isValidStatus =
          candidate.status === "active" ||
          candidate.status === "completed" ||
          candidate.status === "revoked" ||
          candidate.status === "expired";

        if (
          typeof candidate.id !== "string" ||
          typeof candidate.sessionId !== "string" ||
          typeof candidate.topic !== "string" ||
          typeof candidate.recipientLabel !== "string" ||
          !isValidStatus ||
          typeof candidate.createdAt !== "string" ||
          typeof candidate.messageCount !== "number" ||
          typeof candidate.summary !== "string" ||
          !Array.isArray(candidate.transcript)
        ) {
          return null;
        }

        const transcript = candidate.transcript.filter(
          (message): message is Message =>
            Boolean(message) &&
            typeof message === "object" &&
            ((message as Message).role === "user" ||
              (message as Message).role === "assistant") &&
            typeof (message as Message).content === "string"
        );

        return {
          id: candidate.id,
          sessionId: candidate.sessionId,
          topic: candidate.topic,
          recipientLabel: candidate.recipientLabel,
          guestDisplayName:
            typeof candidate.guestDisplayName === "string"
              ? candidate.guestDisplayName
              : undefined,
          status: candidate.status as ShareLinkSessionStatus,
          createdAt: candidate.createdAt,
          completedAt:
            typeof candidate.completedAt === "string"
              ? candidate.completedAt
              : undefined,
          lastMessageAt:
            typeof candidate.lastMessageAt === "string"
              ? candidate.lastMessageAt
              : undefined,
          messageCount: candidate.messageCount,
          summary: candidate.summary,
          transcript,
        };
      })
      .filter((item): item is ExternalConversationRecord => Boolean(item));
  } catch {
    return [];
  }
}

function summarizeExternalConversation(transcript: Message[]) {
  const assistantLast = [...transcript]
    .reverse()
    .find((message) => message.role === "assistant");
  if (!assistantLast) return "Görüşme başladı, özet henüz oluşmadı.";

  const clean = assistantLast.content.replace(/\s+/g, " ").trim();
  if (!clean) return "Görüşme kaydı oluştu.";
  return clean.length > 220 ? `${clean.slice(0, 220)}...` : clean;
}

function mergeExternalConversationFromSession(
  current: ExternalConversationRecord[],
  session: ShareLinkSession
) {
  const transcript = session.transcript.slice(-120);
  const nextRecord: ExternalConversationRecord = {
    id: `external-${session.id}`,
    sessionId: session.id,
    topic: session.topic,
    recipientLabel: session.recipientLabel,
    guestDisplayName: session.guestDisplayName,
    status: session.status,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
    lastMessageAt: session.lastMessageAt,
    messageCount: transcript.filter((message) => message.role === "user").length,
    summary: summarizeExternalConversation(transcript),
    transcript,
  };

  const existingIndex = current.findIndex((item) => item.sessionId === session.id);
  if (existingIndex === -1) {
    return [nextRecord, ...current].slice(0, 160);
  }

  const next = [...current];
  next[existingIndex] = nextRecord;
  return next.sort((a, b) => {
    const atA = Date.parse(a.lastMessageAt || a.completedAt || a.createdAt);
    const atB = Date.parse(b.lastMessageAt || b.completedAt || b.createdAt);
    return atB - atA;
  });
}

function extractShareSessionIdFromPath(pathname: string) {
  const match = pathname.match(/\/share\/s\/([a-z0-9-]+)\/?$/i);
  return match ? match[1] : "";
}

function resolveShareBasePath(pathname: string) {
  const clean = pathname.trim().replace(/\/+$/, "");
  if (!clean || clean === "/") return "";

  const shareIndex = clean.toLowerCase().lastIndexOf("/share/s/");
  if (shareIndex > -1) {
    const prefix = clean.slice(0, shareIndex);
    return prefix === "/" ? "" : prefix;
  }

  return clean;
}

function readStoredUpgradeSuggestion(): UpgradeSuggestionCard | null {
  const raw = localStorage.getItem(STORAGE_KEYS.upgradeSuggestion);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;

    const candidate = parsed as Partial<UpgradeSuggestionCard>;
    const validSources: UpgradeActionSource[] = [
      "capability",
      "pack",
      "repository",
      "coding",
      "upgrade-stage",
    ];

    if (
      typeof candidate.id !== "string" ||
      typeof candidate.createdAt !== "string" ||
      !candidate.source ||
      !validSources.includes(candidate.source) ||
      typeof candidate.title !== "string" ||
      typeof candidate.description !== "string" ||
      (candidate.target !== "capability" && candidate.target !== "pack")
    ) {
      return null;
    }

    return {
      id: candidate.id,
      createdAt: candidate.createdAt,
      source: candidate.source,
      title: candidate.title,
      description: candidate.description,
      sourceUrl:
        typeof candidate.sourceUrl === "string" ? candidate.sourceUrl : undefined,
      target: candidate.target,
    };
  } catch {
    return null;
  }
}

function readStoredPackSelfDevelopmentTasks(): PackSelfDevelopmentTask[] {
  const raw = localStorage.getItem(STORAGE_KEYS.packSelfDevelopmentTasks);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is PackSelfDevelopmentTask => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<PackSelfDevelopmentTask>;
      if (
        typeof candidate.id !== "string" ||
        typeof candidate.createdAt !== "string" ||
        (candidate.status !== "draft" && candidate.status !== "applied") ||
        typeof candidate.title !== "string" ||
        typeof candidate.summary !== "string" ||
        !Array.isArray(candidate.sourceSignals) ||
        !candidate.suggestion ||
        typeof candidate.suggestion !== "object"
      ) {
        return false;
      }

      const suggestion = candidate.suggestion as Partial<UpgradeSuggestionCard>;
      return (
        typeof suggestion.id === "string" &&
        typeof suggestion.createdAt === "string" &&
        typeof suggestion.title === "string" &&
        typeof suggestion.description === "string" &&
        (suggestion.target === "capability" || suggestion.target === "pack")
      );
    });
  } catch {
    return [];
  }
}

function readStoredAutomationAudit(): AutomationAuditEntry[] {
  const raw = localStorage.getItem(STORAGE_KEYS.automationAudit);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const validSources: Array<UpgradeActionSource | "pack-self-dev"> = [
      "capability",
      "pack",
      "repository",
      "coding",
      "upgrade-stage",
      "pack-self-dev",
    ];

    return parsed.filter((item): item is AutomationAuditEntry => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<AutomationAuditEntry>;

      return (
        typeof candidate.id === "string" &&
        typeof candidate.at === "string" &&
        !!candidate.source &&
        validSources.includes(candidate.source) &&
        (candidate.action === "suggest" || candidate.action === "apply") &&
        (candidate.targetType === "capability" || candidate.targetType === "pack") &&
        typeof candidate.targetId === "string" &&
        (candidate.result === "success" ||
          candidate.result === "skipped" ||
          candidate.result === "error") &&
        (typeof candidate.operationId === "undefined" ||
          typeof candidate.operationId === "string") &&
        typeof candidate.note === "string"
      );
    });
  } catch {
    return [];
  }
}

function readStoredChatMemoryExcludedTopics() {
  const raw = localStorage.getItem(STORAGE_KEYS.chatMemoryExcludedTopics);
  if (!raw) return [] as string[];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [] as string[];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [] as string[];
  }
}

function createRecordId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function extractLocalMathExpression(input: string) {
  const clean = input.trim();
  const match = clean.match(/^(?:\/math|hesapla|calculate|calc)\s*:?\s*(.+)$/i);
  if (!match) return "";

  const expression = match[1].trim();
  if (expression.length > 240) return "";
  if (!/^[0-9a-zA-ZğüşöçıİĞÜŞÖÇ\s+\-*/^().,%_:]+$/.test(expression)) return "";
  if (/\b(import|createUnit|evaluate|parse|compile|resolve|typed)\b/i.test(expression)) {
    return "";
  }

  return expression;
}

async function buildLocalScienceContext(input: string) {
  const expression = extractLocalMathExpression(input);
  if (!expression) return "";

  try {
    const mathjs = await import("mathjs");
    const result = mathjs.evaluate(expression);
    const resultText =
      result && typeof result.toString === "function" ? result.toString() : String(result);

    return [
      "Local science engine used: mathjs",
      `Expression: ${expression}`,
      `Result: ${resultText}`,
      "Use this as a verified local calculation result, then explain assumptions and steps clearly.",
    ].join("\n");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown math engine error";
    return [
      "Local science engine attempted: mathjs",
      `Expression: ${expression}`,
      `Error: ${message}`,
      "Do not invent a result. Explain the issue and ask the user to simplify or correct the expression.",
    ].join("\n");
  }
}

async function requestChat(
  messages: Message[],
  selectedModel: string,
  systemPrompt: string
) {
  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: selectedModel,
      stream: false,
      options: {
        temperature: 0.25,
        top_p: 0.85,
        repeat_penalty: 1.12,
      },
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const isModelError =
      response.status === 404 || detail.toLowerCase().includes("model");

    if (isModelError) {
      throw new Error("MODEL_NOT_FOUND");
    }

    throw new Error("OLLAMA_RESPONSE_ERROR");
  }

  const data = await response.json();
  return (
    data.message?.content ||
    "Cevap geldi ama içerik okunamadı. Model adını veya Ollama bağlantısını kontrol edelim."
  );
}

async function requestModelText(
  messages: Message[],
  selectedModel: string,
  systemPrompt: string
) {
  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: selectedModel,
      stream: false,
      options: {
        temperature: 0.35,
        top_p: 0.9,
        repeat_penalty: 1.08,
      },
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const isModelError =
      response.status === 404 || detail.toLowerCase().includes("model");

    if (isModelError) {
      throw new Error("MODEL_NOT_FOUND");
    }

    throw new Error("OLLAMA_RESPONSE_ERROR");
  }

  const data = await response.json();
  return (
    data.message?.content ||
    "Cevap geldi ama içerik okunamadı. Model adını veya Ollama bağlantısını kontrol edelim."
  );
}

function extractJsonPayload(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced?.[1] || text;
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("INVALID_JSON");
  }

  return JSON.parse(source.slice(start, end + 1)) as Record<string, unknown>;
}

function App() {
  const initialBrowserTabs = readStoredBrowserTabs();
  const initialActiveBrowserTabId = initialBrowserTabs[0]?.id || "";
  const [page, setPage] = useState<Page>("hub");
  const [hubTab, setHubTab] = useState<HubTab>("capabilities");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryAnswerOne, setRecoveryAnswerOne] = useState("");
  const [recoveryAnswerTwo, setRecoveryAnswerTwo] = useState("");
  const [recoveryReason, setRecoveryReason] = useState("");
  const [recoveryAttempt, setRecoveryAttempt] = useState<PasswordRecoveryAttempt | null>(
    () => readStoredRecoveryAttempt()
  );
  const [temporaryAccessProfile, setTemporaryAccessProfile] =
    useState<TemporaryAccessProfile | null>(() =>
      readStoredTemporaryAccessProfile()
    );
  const [temporaryChangeProposals, setTemporaryChangeProposals] = useState<
    TemporaryChangeProposal[]
  >(() => readStoredTemporaryChangeProposals());
  const [accounts, setAccounts] = useState<AccountRecord[]>(() =>
    readStoredAccounts()
  );
  const [sessionUsername, setSessionUsername] = useState(() =>
    readStoredSessionUsername()
  );

  const [model, setModel] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.model) || "llama3.2:3b";
  });

  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [input, setInput] = useState("");
  const [chatPanelTab, setChatPanelTab] = useState<ChatPanelTab>(() =>
    getStoredChatPanelTab()
  );
  const [pendingChatUploads, setPendingChatUploads] = useState<PendingChatUpload[]>(
    []
  );
  const [chatUploadMessage, setChatUploadMessage] = useState("");
  const [chatDropActive, setChatDropActive] = useState(false);
  const [chatActionMenuOpen, setChatActionMenuOpen] = useState(false);
  const [shareLinkCreatorOpen, setShareLinkCreatorOpen] = useState(false);
  const [shareLinkRecipient, setShareLinkRecipient] = useState("");
  const [shareLinkTopic, setShareLinkTopic] = useState("");
  const [shareLinkInstruction, setShareLinkInstruction] = useState("");
  const [shareLinkMaxMessages, setShareLinkMaxMessages] = useState("12");
  const [shareLinkExpireHours, setShareLinkExpireHours] = useState("24");
  const [shareLinkMessage, setShareLinkMessage] = useState("");
  const [shareLinkError, setShareLinkError] = useState("");
  const [shareLinkSessions, setShareLinkSessions] = useState<ShareLinkSession[]>(
    () => readStoredShareLinkSessions()
  );
  const [externalConversations, setExternalConversations] = useState<
    ExternalConversationRecord[]
  >(() => readStoredExternalConversations());
  const [openedSourcePreviews, setOpenedSourcePreviews] = useState<
    OpenedSourcePreview[]
  >(() => readStoredOpenedSourcePreviews());
  const [engineDiagnostics, setEngineDiagnostics] = useState<
    EngineDiagnosticReport[]
  >(() => readStoredEngineDiagnostics());
  const [guestDisplayName, setGuestDisplayName] = useState("");
  const [guestInput, setGuestInput] = useState("");
  const [guestMessages, setGuestMessages] = useState<Message[]>([]);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState("");
  const [guestMessage, setGuestMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>("unknown");

  const [licenseToken, setLicenseToken] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.licenseToken) || "";
  });

  const [licenseStatus, setLicenseStatus] =
    useState<LicenseStatus>(getStoredLicenseStatus);

  const [eulaAccepted, setEulaAccepted] = useState(() => {
    return getStoredBoolean(STORAGE_KEYS.eulaAccepted);
  });

  const [privacyAccepted, setPrivacyAccepted] = useState(() => {
    return getStoredBoolean(STORAGE_KEYS.privacyAccepted);
  });

  const [telemetryAccepted, setTelemetryAccepted] = useState(() => {
    return getStoredBoolean(STORAGE_KEYS.telemetryAccepted);
  });
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>(() =>
    getStoredUiLanguage()
  );
  const [onlineAccessEnabled, setOnlineAccessEnabled] = useState(() => {
    return getStoredBoolean(STORAGE_KEYS.onlineAccessEnabled);
  });

  const [learningFromUser, setLearningFromUser] = useState(() => {
    return getStoredBoolean(STORAGE_KEYS.learningFromUser, true);
  });

  const [trendAwareReplies, setTrendAwareReplies] = useState(() => {
    return getStoredBoolean(STORAGE_KEYS.trendAwareReplies, true);
  });

  const [creativeStyleLearning, setCreativeStyleLearning] = useState(() => {
    return getStoredBoolean(STORAGE_KEYS.creativeStyleLearning, true);
  });

  const [capabilityDevelopment, setCapabilityDevelopment] = useState(() => {
    return getStoredBoolean(STORAGE_KEYS.capabilityDevelopment);
  });

  const [activePackId, setActivePackId] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.activePackId) || "";
  });

  const [importedPacks, setImportedPacks] = useState<CorePackProfile[]>(() => {
    return readStoredImportedPacks();
  });
  const [customPacks, setCustomPacks] = useState<CorePackProfile[]>(() => {
    return readStoredCustomPacks();
  });

  const [packLoadStatus, setPackLoadStatus] = useState("");
  const [packLoadError, setPackLoadError] = useState("");
  const [customPackName, setCustomPackName] = useState("");
  const [customPackType, setCustomPackType] = useState("");
  const [customPackDescription, setCustomPackDescription] = useState("");
  const [customPackPrompt, setCustomPackPrompt] = useState("");
  const [customPackMessage, setCustomPackMessage] = useState("");
  const [customPackError, setCustomPackError] = useState("");
  const [packIdea, setPackIdea] = useState("");
  const [packDraftMessage, setPackDraftMessage] = useState("");
  const [packDraftError, setPackDraftError] = useState("");
  const [packDraftLoading, setPackDraftLoading] = useState(false);
  const [packSelfScanMessage, setPackSelfScanMessage] = useState("");
  const [packSelfDevTasks, setPackSelfDevTasks] = useState<PackSelfDevelopmentTask[]>(
    () => readStoredPackSelfDevelopmentTasks()
  );
  const [packSelfDevMessage, setPackSelfDevMessage] = useState("");
  const [packSelfDevError, setPackSelfDevError] = useState("");

  const [repoSource, setRepoSource] = useState<RepositorySource>(() => {
    return getStoredRepositorySource();
  });
  const [repoUrl, setRepoUrl] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.repoUrl) || "";
  });
  const [repoPath, setRepoPath] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.repoPath) || "";
  });
  const [repoRef, setRepoRef] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.repoRef) || "main";
  });
  const [repoPackageName, setRepoPackageName] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.repoPackageName) || "";
    if (stored.trim()) return stored;
    const suggested = suggestPackageNameFromRepoUrl(
      localStorage.getItem(STORAGE_KEYS.repoUrl) || ""
    );
    return suggested || "github-package";
  });
  const [repoFetchStatus, setRepoFetchStatus] = useState("");
  const [repoFetchError, setRepoFetchError] = useState("");
  const [repoFetchedUrl, setRepoFetchedUrl] = useState("");
  const [repoFileContent, setRepoFileContent] = useState("");
  const [repoSuggestionMessage, setRepoSuggestionMessage] = useState("");
  const [repoPullStatus, setRepoPullStatus] = useState("");
  const [repoPullError, setRepoPullError] = useState("");
  const [repoPulledPath, setRepoPulledPath] = useState("");
  const [browserTabs, setBrowserTabs] = useState<BrowserTab[]>(() => initialBrowserTabs);
  const [activeBrowserTabId, setActiveBrowserTabId] = useState(
    initialActiveBrowserTabId
  );
  const [browserAddressInput, setBrowserAddressInput] = useState("");
  const [browserStatusMessage, setBrowserStatusMessage] = useState("");
  const [browserError, setBrowserError] = useState("");
  const [browserHistory, setBrowserHistory] = useState<BrowserHistoryEntry[]>(() =>
    readStoredBrowserHistory()
  );
  const [browserFavorites, setBrowserFavorites] = useState<BrowserFavoriteEntry[]>(
    () => readStoredBrowserFavorites()
  );
  const [browserHistorySearch, setBrowserHistorySearch] = useState("");
  const [browserRenameTabId, setBrowserRenameTabId] = useState<string | null>(null);
  const [browserRenameValue, setBrowserRenameValue] = useState("");
  const [downloadQueue, setDownloadQueue] = useState<DownloadApprovalRequest[]>(
    () => readStoredDownloadQueue()
  );
  const [downloadAudit, setDownloadAudit] = useState<DownloadAuditEntry[]>(() =>
    readStoredDownloadAudit()
  );
  const [downloadDecision, setDownloadDecision] = useState<DownloadApprovalDecision | null>(
    null
  );
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadTargetPath, setDownloadTargetPath] = useState("");
  const [downloadApprovalError, setDownloadApprovalError] = useState("");
  const [downloadProcessing, setDownloadProcessing] = useState(false);

  const [codingModel, setCodingModel] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.codingModel) || "qwen2.5-coder:7b";
  });
  const [codingSearch, setCodingSearch] = useState(() => {
    return (
      localStorage.getItem(STORAGE_KEYS.codingSearch) ||
      "tauri plugin dialog fs shell"
    );
  });
  const [codingMessage, setCodingMessage] = useState("");
  const [codingMessages, setCodingMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.codingChatHistory);

    if (!saved) {
      return [
        {
          role: "assistant",
          content:
            "Kodlama alanı hazır. Kütüphane ara, örnek iste veya doğrudan kod konuşalım.",
        },
      ];
    }

    try {
      const parsed = JSON.parse(saved) as Message[];

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed;
    } catch {
      return [];
    }
  });
  const [codingInput, setCodingInput] = useState("");
  const [codingLoading, setCodingLoading] = useState(false);
  const [continuationMode, setContinuationMode] = useState(() => {
    const value = localStorage.getItem(STORAGE_KEYS.continuationMode);
    return value === null ? true : value === "true";
  });
  const [continuationPlan, setContinuationPlan] =
    useState<ContinuationPlan | null>(() => readStoredContinuationPlan());
  const [continuationMessage, setContinuationMessage] = useState("");
  const [productEnabled, setProductEnabled] = useState(() => {
    const value = localStorage.getItem(STORAGE_KEYS.productEnabled);
    return value === null ? true : value === "true";
  });
  const [productStatusMessage, setProductStatusMessage] = useState("");
  const [currentStatus, setCurrentStatus] = useState("Hazırlanıyor");
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>(
    () => readStoredActivityLog()
  );
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalRunning, setTerminalRunning] = useState(false);
  const [terminalError, setTerminalError] = useState("");
  const [terminalHistory, setTerminalHistory] = useState<TerminalRunEntry[]>(
    () => readStoredTerminalHistory()
  );
  const [upgradeSuggestionCard, setUpgradeSuggestionCard] =
    useState<UpgradeSuggestionCard | null>(() => readStoredUpgradeSuggestion());
  const [automationAudit, setAutomationAudit] = useState<AutomationAuditEntry[]>(
    () => readStoredAutomationAudit()
  );
  const productEnabledRef = useRef(productEnabled);
  const continuationTimerRef = useRef<number | null>(null);
  const assistantAvatarInputRef = useRef<HTMLInputElement | null>(null);
  const chatUploadInputRef = useRef<HTMLInputElement | null>(null);
  const chatMessagesRef = useRef<HTMLDivElement | null>(null);
  const guestMessagesRef = useRef<HTMLDivElement | null>(null);
  const browserFrameRef = useRef<HTMLIFrameElement | null>(null);

  const [masterPersonaName, setMasterPersonaName] = useState(() => {
    return (
      localStorage.getItem(STORAGE_KEYS.masterPersonaName) ||
      defaultMasterPersonaName
    );
  });
  const [masterPersonaHeadline, setMasterPersonaHeadline] = useState(() => {
    return (
      localStorage.getItem(STORAGE_KEYS.masterPersonaHeadline) ||
      defaultMasterPersonaHeadline
    );
  });
  const [masterPersonaBio, setMasterPersonaBio] = useState(() => {
    return (
      localStorage.getItem(STORAGE_KEYS.masterPersonaBio) ||
      defaultMasterPersonaBio
    );
  });
  const [assistantAvatarDataUrl, setAssistantAvatarDataUrl] = useState(() => {
    return (
      localStorage.getItem(STORAGE_KEYS.assistantAvatarDataUrl) ||
      "/persona-avatar.png"
    );
  });
  const [languageIdentityProfile, setLanguageIdentityProfile] =
    useState<LanguageIdentityProfile>(() => readStoredLanguageIdentityProfile());
  const [languageIdentityMessage, setLanguageIdentityMessage] = useState("");
  const [personaEngineMessage, setPersonaEngineMessage] = useState("");

  const [customCapabilities, setCustomCapabilities] = useState<CustomCapability[]>(
    () => readStoredCustomCapabilities()
  );
  const [capabilityOverrides, setCapabilityOverrides] = useState<
    Record<string, CapabilityOverride>
  >(() => readStoredCapabilityOverrides());
  const [capabilityOrder, setCapabilityOrder] = useState<string[]>(
    () => readStoredCapabilityOrder()
  );
  const [capabilityMenuOpenId, setCapabilityMenuOpenId] = useState<string | null>(
    null
  );
  const [draggedCapabilityId, setDraggedCapabilityId] = useState<string | null>(
    null
  );
  const [dropTargetCapabilityId, setDropTargetCapabilityId] = useState<
    string | null
  >(null);
  const [editingCapabilityId, setEditingCapabilityId] = useState<string | null>(
    null
  );
  const [editingCapabilityName, setEditingCapabilityName] = useState("");
  const [editingCapabilityDescription, setEditingCapabilityDescription] =
    useState("");
  const [capabilityActionMessage, setCapabilityActionMessage] = useState("");
  const [capabilityActionError, setCapabilityActionError] = useState("");
  const [capabilityResearchTargetId, setCapabilityResearchTargetId] = useState<
    string | null
  >(() => localStorage.getItem(STORAGE_KEYS.capabilityResearchTarget));
  const [capabilityLibraryPool, setCapabilityLibraryPool] = useState<
    CapabilityLibrarySuggestion[]
  >(() => readStoredCapabilityLibraryPool());
  const [capabilityLibraryPending, setCapabilityLibraryPending] = useState<
    CapabilityLibrarySuggestion[]
  >(() => readStoredCapabilityLibraryPending());
  const [customCapabilityName, setCustomCapabilityName] = useState("");
  const [customCapabilityDescription, setCustomCapabilityDescription] =
    useState("");
  const [customCapabilityMessage, setCustomCapabilityMessage] = useState("");
  const [customCapabilityError, setCustomCapabilityError] = useState("");
  const [capabilityIdea, setCapabilityIdea] = useState("");
  const [capabilityDraftMessage, setCapabilityDraftMessage] = useState("");
  const [capabilityDraftError, setCapabilityDraftError] = useState("");
  const [capabilityDraftLoading, setCapabilityDraftLoading] = useState(false);

  const [upgradeEngineReport, setUpgradeEngineReport] =
    useState<UpgradeEngineReport | null>(() => readStoredUpgradeEngineReport());
  const [upgradeEngineMessage, setUpgradeEngineMessage] = useState("");
  const [upgradeStageOrder, setUpgradeStageOrder] = useState<string[]>(
    () => readStoredUpgradeStageOrder()
  );
  const [upgradeStageMenuOpenId, setUpgradeStageMenuOpenId] = useState<
    string | null
  >(null);

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.chatHistory);

    if (!saved) {
      return defaultMessages;
    }

    try {
      const parsed = JSON.parse(saved) as Message[];

      if (!Array.isArray(parsed)) {
        return defaultMessages;
      }

      return parsed;
    } catch {
      return defaultMessages;
    }
  });
  const [temporaryMessages, setTemporaryMessages] = useState<Message[]>([
    ...defaultMessages,
  ]);
  const [memoryAdminMessage, setMemoryAdminMessage] = useState("");
  const [memoryAdminError, setMemoryAdminError] = useState("");
  const [memoryTopicSearch, setMemoryTopicSearch] = useState("");
  const [memoryTopicsExpanded, setMemoryTopicsExpanded] = useState(false);
  const [memoryTopicMenuOpenKey, setMemoryTopicMenuOpenKey] = useState<string | null>(
    null
  );
  const [chatMemoryExcludedTopics, setChatMemoryExcludedTopics] = useState<string[]>(
    () => readStoredChatMemoryExcludedTopics()
  );
  const [shareSessionPathId, setShareSessionPathId] = useState(() =>
    extractShareSessionIdFromPath(window.location.pathname)
  );

  const isTemporarySession = Boolean(temporaryAccessProfile) && !sessionUsername;
  const isAuthenticated = Boolean(sessionUsername || isTemporarySession);
  const currentAccount = useMemo(
    () =>
      accounts.find(
        (item) => normalizeUsername(item.username) === normalizeUsername(sessionUsername)
      ) || null,
    [accounts, sessionUsername]
  );
  const isAdmin = currentAccount?.role === "admin";
  const temporaryPageScope = useMemo(
    () =>
      temporaryAccessProfile?.scopes?.filter((item): item is Page =>
        TEMPORARY_PROFILE_SCOPES.includes(item)
      ) || TEMPORARY_PROFILE_SCOPES,
    [temporaryAccessProfile]
  );
  const temporaryHubTabs = useMemo(
    () =>
      TEMPORARY_PROFILE_HUB_TABS.filter((tab) =>
        temporaryPageScope.includes("hub") ? true : tab === "capabilities"
      ),
    [temporaryPageScope]
  );
  const pendingAccounts = useMemo(
    () => accounts.filter((item) => item.approvalStatus === "pending"),
    [accounts]
  );
  const manageableAccounts = useMemo(
    () =>
      accounts.filter(
        (item) =>
          item.role !== "admin" &&
          normalizeUsername(item.username) !== normalizeUsername(sessionUsername)
      ),
    [accounts, sessionUsername]
  );
  const approvalHistory = useMemo(
    () =>
      accounts
        .filter((item) => item.approvalStatus === "approved" && item.approvedAt)
        .sort((a, b) => {
          const ta = a.approvedAt ? new Date(a.approvedAt).getTime() : 0;
          const tb = b.approvedAt ? new Date(b.approvedAt).getTime() : 0;
          return tb - ta;
        }),
    [accounts]
  );
  const chatMemoryTopics = useMemo(() => {
    const map = new Map<string, ChatMemoryTopic>();
    messages.forEach((message, index) => {
      if (message.role !== "user") return;
      const key = buildChatMemoryTopicKey(message.content);
      if (!key) return;
      const title = buildChatMemoryTopicTitle(message.content);
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        existing.lastIndex = index;
        return;
      }
      map.set(key, {
        key,
        title,
        count: 1,
        lastIndex: index,
      });
    });
    return Array.from(map.values()).sort((a, b) => b.lastIndex - a.lastIndex);
  }, [messages]);
  const filteredChatMemoryTopics = useMemo(() => {
    const query = memoryTopicSearch.trim().toLocaleLowerCase("tr-TR");
    if (!query) return chatMemoryTopics;

    return chatMemoryTopics.filter((topic) =>
      topic.title.toLocaleLowerCase("tr-TR").includes(query)
    );
  }, [chatMemoryTopics, memoryTopicSearch]);
  const activeBrowserTab = useMemo(
    () => browserTabs.find((tab) => tab.id === activeBrowserTabId) || null,
    [browserTabs, activeBrowserTabId]
  );
  const filteredBrowserHistory = useMemo(() => {
    const query = browserHistorySearch.trim().toLocaleLowerCase("tr-TR");
    if (!query) return browserHistory;
    return browserHistory.filter((entry) => {
      const haystack = `${entry.title} ${entry.url}`.toLocaleLowerCase("tr-TR");
      return haystack.includes(query);
    });
  }, [browserHistory, browserHistorySearch]);
  const currentBrowserFavorite = useMemo(() => {
    if (!activeBrowserTab) return null;
    const normalized = normalizeBrowserUrl(activeBrowserTab.url);
    return (
      browserFavorites.find(
        (item) => normalizeBrowserUrl(item.url) === normalized
      ) || null
    );
  }, [activeBrowserTab, browserFavorites]);
  const pendingDownloadRequest = useMemo(
    () =>
      downloadDecision
        ? downloadQueue.find((item) => item.id === downloadDecision.requestId) || null
        : null,
    [downloadDecision, downloadQueue]
  );

  const isLicensed = licenseStatus === "valid";
  const isRestricted = !isLicensed;
  const isProductOff = !productEnabled;
  const isGuestShareMode = Boolean(shareSessionPathId);
  const guestShareSession = useMemo(
    () =>
      shareLinkSessions.find((session) => session.id === shareSessionPathId) || null,
    [shareLinkSessions, shareSessionPathId]
  );
  const externalConversationList = useMemo(
    () =>
      [...externalConversations].sort((a, b) => {
        const atA = Date.parse(a.lastMessageAt || a.completedAt || a.createdAt);
        const atB = Date.parse(b.lastMessageAt || b.completedAt || b.createdAt);
        return atB - atA;
      }),
    [externalConversations]
  );
  const visibleChatMessages = isTemporarySession ? temporaryMessages : messages;
  const chatUiText = CHAT_UI_TEXT[uiLanguage];
  const hubTabLabels: Record<HubTab, string> = {
    capabilities: "Yetenekler",
    upgrades: "Yükseltmeler",
    packs: "Paketler",
    repository: "Depo",
    models: "Modeller",
    coding: "Kodlama",
    browser: "Tarayıcı",
  };
  const visibleHubTabs: HubTab[] = isTemporarySession
    ? temporaryHubTabs
    : HUB_TABS;
  const currentSessionLabel = isTemporarySession
    ? temporaryAccessProfile?.id || "temporary"
    : currentAccount?.username || sessionUsername;
  const currentRoleLabel = isAdmin
    ? "Admin"
    : isTemporarySession
    ? "Geçici profil"
    : "Kullanıcı";
  const activeHubLabel = hubTabLabels[hubTab];
  const latestAutomationAudit = automationAudit[0] || null;
  const latestEngineDiagnostic = engineDiagnostics[0] || null;

  function openHubTab(tab: HubTab) {
    if (isTemporarySession && !temporaryHubTabs.includes(tab)) {
      setAuthMessage(
        "Geçici profilde yalnızca Yetenekler ve Modeller sekmeleri açıktır."
      );
      setPage("hub");
      setHubTab(temporaryHubTabs[0] || "capabilities");
      return;
    }
    setPage("hub");
    setHubTab(tab);
  }

  function goToPlanTarget(plan: Pick<ContinuationPlan, "nextPage" | "nextHubTab">) {
    if (plan.nextPage === "hub" && plan.nextHubTab) {
      openHubTab(plan.nextHubTab);
      return;
    }

    setPage(plan.nextPage);
  }

  function addActivityLog(
    message: string,
    tone: ActivityLogEntry["tone"] = "info",
    operationId?: string
  ) {
    const entry: ActivityLogEntry = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      at: new Date().toISOString(),
      message,
      tone,
      operationId,
    };

    setActivityLog((current) => {
      const next = [entry, ...current];
      return next.slice(0, 80);
    });
    setCurrentStatus(message);
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.chatHistory, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.chatPanelTab, chatPanelTab);
  }, [chatPanelTab]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.chatMemoryExcludedTopics,
      JSON.stringify(chatMemoryExcludedTopics)
    );
  }, [chatMemoryExcludedTopics]);

  useEffect(() => {
    const validTopicKeys = new Set(chatMemoryTopics.map((topic) => topic.key));
    setChatMemoryExcludedTopics((current) => {
      const next = current.filter((key) => validTopicKeys.has(key));
      return next.length === current.length ? current : next;
    });
  }, [chatMemoryTopics]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.model, model);
  }, [model]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.licenseToken, licenseToken);
  }, [licenseToken]);

  useEffect(() => {
    validateLicense();
  }, [licenseToken, eulaAccepted, privacyAccepted]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.licenseStatus, licenseStatus);
  }, [licenseStatus]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.eulaAccepted, String(eulaAccepted));
  }, [eulaAccepted]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.privacyAccepted, String(privacyAccepted));
  }, [privacyAccepted]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.telemetryAccepted,
      String(telemetryAccepted)
    );
  }, [telemetryAccepted]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.uiLanguage, uiLanguage);
  }, [uiLanguage]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.onlineAccessEnabled,
      String(onlineAccessEnabled)
    );
  }, [onlineAccessEnabled]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.learningFromUser,
      String(learningFromUser)
    );
  }, [learningFromUser]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.trendAwareReplies,
      String(trendAwareReplies)
    );
  }, [trendAwareReplies]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.creativeStyleLearning,
      String(creativeStyleLearning)
    );
  }, [creativeStyleLearning]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.capabilityDevelopment,
      String(capabilityDevelopment)
    );
  }, [capabilityDevelopment]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.activePackId, activePackId);
  }, [activePackId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.importedPacks, JSON.stringify(importedPacks));
  }, [importedPacks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.customPacks, JSON.stringify(customPacks));
  }, [customPacks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.browserTabs, JSON.stringify(browserTabs));
  }, [browserTabs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.browserHistory, JSON.stringify(browserHistory));
  }, [browserHistory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.browserFavorites, JSON.stringify(browserFavorites));
  }, [browserFavorites]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.downloadQueue, JSON.stringify(downloadQueue));
  }, [downloadQueue]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.downloadAudit, JSON.stringify(downloadAudit));
  }, [downloadAudit]);

  useEffect(() => {
    if (browserTabs.length === 0) {
      const fallback = createDefaultBrowserTab();
      setBrowserTabs([fallback]);
      setActiveBrowserTabId(fallback.id);
      return;
    }

    const activeExists = browserTabs.some((tab) => tab.id === activeBrowserTabId);
    if (!activeExists) {
      setActiveBrowserTabId(browserTabs[0].id);
    }
  }, [browserTabs, activeBrowserTabId]);

  useEffect(() => {
    if (!activeBrowserTab) return;
    setBrowserAddressInput(activeBrowserTab.url);
  }, [activeBrowserTab?.id, activeBrowserTab?.url]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (isAdmin) return;

    if (isTemporarySession) {
      if (!temporaryPageScope.includes(page)) {
        setPage("chat");
        return;
      }

      if (page === "hub" && !temporaryHubTabs.includes(hubTab)) {
        setHubTab(temporaryHubTabs[0] || "capabilities");
      }
      return;
    }

    if (page !== "chat") {
      setPage("chat");
    }
  }, [
    isAuthenticated,
    isAdmin,
    isTemporarySession,
    page,
    hubTab,
    temporaryPageScope,
    temporaryHubTabs,
  ]);

  useEffect(() => {
    if (!currentAccount || currentAccount.accessStatus !== "inactive") return;
    setSessionUsername("");
    setAuthError("Hesabın pasif duruma alındı. Admin onayıyla yeniden açılabilir.");
    addActivityLog(`Pasif hesap oturumu kapatıldı: ${currentAccount.username}`, "warn");
  }, [currentAccount]);

  useEffect(() => {
    if (sessionUsername) {
      localStorage.setItem(
        STORAGE_KEYS.session,
        JSON.stringify({ username: sessionUsername, loginAt: new Date().toISOString() })
      );
    } else {
      localStorage.removeItem(STORAGE_KEYS.session);
    }
  }, [sessionUsername]);

  useEffect(() => {
    if (recoveryAttempt) {
      localStorage.setItem(
        STORAGE_KEYS.recoveryAttempt,
        JSON.stringify(recoveryAttempt)
      );
    } else {
      localStorage.removeItem(STORAGE_KEYS.recoveryAttempt);
    }
  }, [recoveryAttempt]);

  useEffect(() => {
    if (temporaryAccessProfile) {
      localStorage.setItem(
        STORAGE_KEYS.temporaryAccessProfile,
        JSON.stringify(temporaryAccessProfile)
      );
    } else {
      localStorage.removeItem(STORAGE_KEYS.temporaryAccessProfile);
    }
  }, [temporaryAccessProfile]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.temporaryChangeProposals,
      JSON.stringify(temporaryChangeProposals)
    );
  }, [temporaryChangeProposals]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.openedSourcePreviews,
      JSON.stringify(openedSourcePreviews)
    );
  }, [openedSourcePreviews]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.engineDiagnostics,
      JSON.stringify(engineDiagnostics)
    );
  }, [engineDiagnostics]);

  useEffect(() => {
    if (!temporaryAccessProfile) return;
    const expiresAtMs = Date.parse(temporaryAccessProfile.expiresAt);
    if (!Number.isFinite(expiresAtMs)) {
      setTemporaryAccessProfile(null);
      return;
    }

    if (expiresAtMs <= Date.now()) {
      setTemporaryAccessProfile(null);
      setAuthMessage("Geçici profil süresi doldu. Lütfen normal giriş yap.");
      setPage("chat");
      return;
    }

    const timer = window.setTimeout(() => {
      setTemporaryAccessProfile(null);
      setAuthMessage("Geçici profil süresi doldu. Lütfen normal giriş yap.");
      addActivityLog("Geçici profil süresi dolduğu için kapatıldı.", "warn");
    }, Math.max(500, expiresAtMs - Date.now()));

    return () => window.clearTimeout(timer);
  }, [temporaryAccessProfile]);

  useEffect(() => {
    if (!isTemporarySession) return;
    setTemporaryMessages([...defaultMessages]);
  }, [isTemporarySession, temporaryAccessProfile?.id]);

  useEffect(() => {
    if (!sessionUsername) return;

    const exists = accounts.some(
      (item) =>
        normalizeUsername(item.username) === normalizeUsername(sessionUsername)
    );

    if (!exists) {
      setSessionUsername("");
    }
  }, [accounts, sessionUsername]);

  useEffect(() => {
    if (accounts.length === 0) {
      setAuthMode("register");
    }
  }, [accounts.length]);

  useEffect(() => {
    if (page !== "chat") return;
    const node = chatMessagesRef.current;
    if (!node) return;
    requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight;
    });
  }, [page, visibleChatMessages, loading]);

  useEffect(() => {
    if (!isGuestShareMode) return;
    const node = guestMessagesRef.current;
    if (!node) return;
    requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight;
    });
  }, [isGuestShareMode, guestMessages, guestLoading]);

  useEffect(() => {
    const syncPath = () => {
      setShareSessionPathId(extractShareSessionIdFromPath(window.location.pathname));
    };
    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, []);

  useEffect(() => {
    if (!isGuestShareMode) return;

    if (!guestShareSession) {
      setGuestMessages([
        {
          role: "assistant",
          content:
            "Paylaşım linki bulunamadı veya bu cihazda erişilebilir değil. Linki oluşturan ana cihazdan tekrar kopyalayıp aç.",
        },
      ]);
      return;
    }

    if (guestShareSession.transcript.length > 0) {
      setGuestMessages(guestShareSession.transcript);
      return;
    }

    setGuestMessages([
      {
        role: "assistant",
        content:
          "Merhaba. Bu kısa görüşme, iletilen konuyu netleştirmek için oluşturuldu. Yalnızca bu konu hakkında birkaç soru soracağım.",
      },
    ]);
  }, [isGuestShareMode, guestShareSession]);

  useEffect(() => {
    if (page === "chat") return;
    setChatActionMenuOpen(false);
    setShareLinkCreatorOpen(false);
  }, [page]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.repoSource, repoSource);
  }, [repoSource]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.repoUrl, repoUrl);
  }, [repoUrl]);

  useEffect(() => {
    const suggestion = suggestPackageNameFromRepoUrl(repoUrl);
    if (!suggestion) return;
    setRepoPackageName((current) => {
      const clean = current.trim();
      if (clean && clean !== "github-package") return current;
      return suggestion;
    });
  }, [repoUrl]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.repoPath, repoPath);
  }, [repoPath]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.repoRef, repoRef);
  }, [repoRef]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.repoPackageName, repoPackageName);
  }, [repoPackageName]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.codingModel, codingModel);
  }, [codingModel]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.codingSearch, codingSearch);
  }, [codingSearch]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.codingChatHistory,
      JSON.stringify(codingMessages)
    );
  }, [codingMessages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.continuationMode, String(continuationMode));
  }, [continuationMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.productEnabled, String(productEnabled));
    productEnabledRef.current = productEnabled;
    setCurrentStatus(productEnabled ? "Ürün açık" : "Ürün kapalı");
  }, [productEnabled]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.activityLog, JSON.stringify(activityLog));
  }, [activityLog]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.terminalHistory,
      JSON.stringify(terminalHistory)
    );
  }, [terminalHistory]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.shareLinkSessions,
      JSON.stringify(shareLinkSessions)
    );
  }, [shareLinkSessions]);

  useEffect(() => {
    setExternalConversations((current) => {
      let next = current;
      shareLinkSessions.forEach((session) => {
        const alreadyTracked = next.some((item) => item.sessionId === session.id);
        if (alreadyTracked || session.transcript.length > 0 || session.status !== "active") {
          next = mergeExternalConversationFromSession(next, session);
        }
      });
      return next;
    });
  }, [shareLinkSessions]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.externalConversations,
      JSON.stringify(externalConversations)
    );
  }, [externalConversations]);

  useEffect(() => {
    if (upgradeSuggestionCard) {
      localStorage.setItem(
        STORAGE_KEYS.upgradeSuggestion,
        JSON.stringify(upgradeSuggestionCard)
      );
    } else {
      localStorage.removeItem(STORAGE_KEYS.upgradeSuggestion);
    }
  }, [upgradeSuggestionCard]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.packSelfDevelopmentTasks,
      JSON.stringify(packSelfDevTasks)
    );
  }, [packSelfDevTasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.automationAudit, JSON.stringify(automationAudit));
  }, [automationAudit]);

  useEffect(() => {
    return () => {
      if (continuationTimerRef.current !== null) {
        window.clearTimeout(continuationTimerRef.current);
        continuationTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    addActivityLog(`Ekran açıldı: ${page}`, "info");
  }, [page]);

  useEffect(() => {
    const now = Date.now();
    let changed = false;

    const next = shareLinkSessions.map((item) => {
      if (item.status !== "active") return item;
      const expiresAtMs = Date.parse(item.expiresAt);
      if (Number.isNaN(expiresAtMs) || expiresAtMs > now) return item;
      changed = true;
      return {
        ...item,
        status: "expired" as ShareLinkSessionStatus,
        completedAt: item.completedAt || new Date().toISOString(),
      };
    });

    if (changed) {
      setShareLinkSessions(next);
      setExternalConversations((current) => {
        let acc = current;
        next.forEach((session) => {
          acc = mergeExternalConversationFromSession(acc, session);
        });
        return acc;
      });
    }
  }, [shareLinkSessions]);

  useEffect(() => {
    if (upgradeEngineReport) {
      localStorage.setItem(
        STORAGE_KEYS.upgradeEngineReport,
        JSON.stringify(upgradeEngineReport)
      );
    } else {
      localStorage.removeItem(STORAGE_KEYS.upgradeEngineReport);
    }
  }, [upgradeEngineReport]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.upgradeStageOrder,
      JSON.stringify(upgradeStageOrder)
    );
  }, [upgradeStageOrder]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.masterPersonaName, masterPersonaName);
  }, [masterPersonaName]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.masterPersonaHeadline,
      masterPersonaHeadline
    );
  }, [masterPersonaHeadline]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.masterPersonaBio, masterPersonaBio);
  }, [masterPersonaBio]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.assistantAvatarDataUrl,
      assistantAvatarDataUrl
    );
  }, [assistantAvatarDataUrl]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.languageIdentityProfile,
      JSON.stringify(languageIdentityProfile)
    );
  }, [languageIdentityProfile]);

  useEffect(() => {
    if (continuationPlan) {
      localStorage.setItem(
        STORAGE_KEYS.continuationPlan,
        JSON.stringify(continuationPlan)
      );
    } else {
      localStorage.removeItem(STORAGE_KEYS.continuationPlan);
    }
  }, [continuationPlan]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.customCapabilities,
      JSON.stringify(customCapabilities)
    );
  }, [customCapabilities]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.capabilityOverrides,
      JSON.stringify(capabilityOverrides)
    );
  }, [capabilityOverrides]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.capabilityOrder,
      JSON.stringify(capabilityOrder)
    );
  }, [capabilityOrder]);

  useEffect(() => {
    if (capabilityResearchTargetId) {
      localStorage.setItem(
        STORAGE_KEYS.capabilityResearchTarget,
        capabilityResearchTargetId
      );
    } else {
      localStorage.removeItem(STORAGE_KEYS.capabilityResearchTarget);
    }
  }, [capabilityResearchTargetId]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.capabilityLibraryPool,
      JSON.stringify(capabilityLibraryPool)
    );
  }, [capabilityLibraryPool]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.capabilityLibraryPending,
      JSON.stringify(capabilityLibraryPending)
    );
  }, [capabilityLibraryPending]);

  const allPackProfiles = useMemo(
    () => [...corePackProfiles, ...importedPacks, ...customPacks],
    [importedPacks, customPacks]
  );

  const activePack = useMemo(() => {
    return allPackProfiles.find((pack) => pack.id === activePackId) || null;
  }, [activePackId, allPackProfiles]);

  const personaProfile = useMemo(
    () =>
      buildPersonaProfile({
        name: masterPersonaName,
        headline: masterPersonaHeadline,
        bio: masterPersonaBio,
        avatarDataUrl: assistantAvatarDataUrl,
        learningFromUser,
        creativeStyleLearning,
        trendAwareReplies,
      }),
    [
      masterPersonaName,
      masterPersonaHeadline,
      masterPersonaBio,
      assistantAvatarDataUrl,
      learningFromUser,
      creativeStyleLearning,
      trendAwareReplies,
    ]
  );

  const systemPrompt = useMemo(
    () =>
      buildSystemPrompt({
        learningFromUser,
        trendAwareReplies,
        creativeStyleLearning,
        capabilityDevelopment,
        onlineAccessEnabled,
        activePack,
        personaProfile,
        languageIdentityProfile,
        continuationMode,
      }),
    [
      learningFromUser,
      trendAwareReplies,
      creativeStyleLearning,
      capabilityDevelopment,
      onlineAccessEnabled,
      activePack,
      personaProfile,
      languageIdentityProfile,
      continuationMode,
    ]
  );

  const codingSystemPrompt = useMemo(
    () =>
      [
        "You are OC Coding Studio.",
        "Answer in the same language as the user.",
        "Focus on practical coding help, repository guidance, library choices, and concise implementation steps.",
        "If the user asks for libraries or patterns, suggest specific repositories, package names, or search queries.",
        "Do not hallucinate package availability.",
        `Use this OC language identity: ${languageIdentityProfile.signature}`,
        `Tone: ${languageIdentityProfile.tone}`,
      ].join(" "),
    [languageIdentityProfile]
  );

  const capabilities: Capability[] = useMemo(
    () => [
      {
        id: "local-chat",
        name: "Sohbet Et",
        status: isLicensed ? "ready" : "restricted",
        source: "core",
        description: "Ollama üzerinden yerel LLM ile konuş.",
      },
      {
        id: "model-manager",
        name: "Modelleri Yönet",
        status: "active",
        source: "core",
        description:
          "Yüklü yerel modelleri listele, seç, kaydet ve aktif modeli yönet.",
      },
      {
        id: "local-memory",
        name: "Hafızayı Sakla",
        status: "active",
        source: "core",
        description:
          "Sohbet geçmişini cihazda sakla ve sonraki açılışta geri yükle.",
      },
      {
        id: "project-memory",
        name: "Projeyi Hatırla",
        status: "planned",
        source: "core",
        description:
          "Kullanıcının proje notlarını, kararlarını ve devam eden işleri yerelde hatırla.",
      },
      {
        id: "skill-pack-manager",
        name: "Paketleri Yönet",
        status: "planned",
        source: "core",
        description:
          ".corepack modül, rol, persona, veri seti ve yetenek paketlerini yönet.",
      },
      {
        id: "repository-connector",
        name: "Depo Bağlantısı",
        status: "ready",
        source: "core",
        description:
          "GitHub ve GitLab'dan public dosya çekme ön izlemesini geliştirici akışına dahil et.",
      },
      {
        id: "scientific-computing",
        name: "Bilimsel Hesaplama",
        status: "ready",
        source: "core",
        description:
          "Quantum, matematik ve kimya kütüphanelerini kullanarak bilimsel analiz ve araştırma akışlarını destekle.",
      },
      {
        id: "capability-registry",
        name: "Yetenekleri Yönet",
        status: "active",
        source: "core",
        description:
          "OC'in aktif, sınırlı, planlanan ve paketlerden gelen yeteneklerini kayıt altında tut.",
      },
      {
        id: "license-gate",
        name: "Lisansı Kontrol Et",
        status: isLicensed ? "active" : "restricted",
        source: "core",
        description:
          "Token yoksa veya geçersizse açıkça sınırlı/deaktive mod göster.",
      },
      {
        id: "safe-mode",
        name: "Güvenliği Koru",
        status: "active",
        source: "core",
        description:
          "Zararlı veya riskli isteklerde güvenli cevap davranışını koru.",
      },
      {
        id: "language-guard",
        name: "Dili Koru",
        status: "active",
        source: "core",
        description:
          "Kullanıcının dilini algıla ve aynı dilde temiz cevap ver.",
      },
      {
        id: "language-identity-engine",
        name: "Dil Kimliği Motoru",
        status: "active",
        source: "core",
        description:
          "OC'ın özgün imza tonunu, cevap ilkelerini ve yaratıcı anlatı ritmini system prompt katmanına bağla.",
      },
      {
        id: "offline-status",
        name: "Bağlantıyı Kontrol Et",
        status:
          ollamaStatus === "online"
            ? "active"
            : ollamaStatus === "offline"
            ? "offline"
            : "planned",
        source: "core",
        description:
          "Ollama çalışıyor mu, model hazır mı ve internet gerekmiyor mu kontrol et.",
      },
      {
        id: "local-file-reader",
        name: "Dosya Oku",
        status: "planned",
        source: "core",
        description:
          "Kullanıcının seçtiği yerel dosyaları oku ve özetle.",
      },
      {
        id: "export-import",
        name: "Dığa / İçe Aktar",
        status: "planned",
        source: "core",
        description:
          "Sohbetleri, ayarları, hafızayı ve paket listesini dığa/içe aktar.",
      },
      {
        id: "diagnostics",
        name: "Tanılama Yap",
        status: "planned",
        source: "core",
        description:
          "Sistem durumunu kontrol et ve anlağılır hata raporu üret.",
      },
      {
        id: "permission-manager",
        name: "İzinleri Yönet",
        status: "planned",
        source: "core",
        description:
          "Paketlerin hangi izinleri istediğini göster ve yönet.",
      },
      {
        id: "tool-runner",
        name: "Araç Çalıştır",
        status: "planned",
        source: "core",
        description:
          "Güvenli, izinli ve kayıtlı araçları çalıştır.",
      },
      {
        id: "narrative-studio",
        name: "Narrative Studio",
        status: "planned",
        source: "core",
        description:
          "Kullanıcıdan öğrenerek metin, senaryo ve hikaye üretimini edebi anlatı ile güçlendir.",
      },
      {
        id: "visual-style-studio",
        name: "Visual Style Studio",
        status: "planned",
        source: "core",
        description:
          "Kullanıcının stil tercihlerini öğren ve bu stile göre görsel üretim akışı kur.",
      },
      {
        id: "video-story-studio",
        name: "Video Story Studio",
        status: "planned",
        source: "core",
        description:
          "Kullanıcının kurgu dili ve sinematografi tercihlerini öğren; video fikir ve sahne planı üret.",
      },
      {
        id: "preference-learning-engine",
        name: "Preference Learning Engine",
        status: "planned",
        source: "core",
        description:
          "Genel trendleri ve geçmiş argümanları analiz et; kullanıcı tercihine göre yanıt üslubunu evrimle.",
      },
      {
        id: "cloud-provider-models",
        name: "Cloud Provider Models",
        status: "planned",
        source: "core",
        description:
          "ChatGPT ve Gemini seçeneklerini model sağlayıcısı olarak sun; açık API yapılandırmasıyla isteğe bağlı kullan.",
      },
      {
        id: "voice-analysis",
        name: "Voice Analysis",
        status: "planned",
        source: "core",
        description:
          "Konuşmayı metne dönüştür, tonlama ve konuşmacı ayrımı gibi ses sinyallerini analiz et.",
      },
      {
        id: "image-analysis",
        name: "Image Analysis",
        status: "planned",
        source: "core",
        description:
          "Görselleri analiz et; OCR, sahne/nesne özeti ve içerik bağlamını metinle ilişkilendir.",
      },
      {
        id: "general-awareness-engine",
        name: "General Awareness Engine",
        status: "planned",
        source: "core",
        description:
          "Metin, ses ve görüntüden gelen sinyalleri birleştirip genel durum farkındalığı üret.",
      },
    ],
    [isLicensed, ollamaStatus]
  );

  const mergedCapabilities = useMemo<CapabilityCard[]>(() => {
    return [...capabilities, ...customCapabilities].map((capability) => {
      const override = capabilityOverrides[capability.id];

      return {
        ...capability,
        name: override?.name ?? capability.name,
        description: override?.description ?? capability.description,
        isArchived: override?.isArchived ?? false,
      };
    });
  }, [capabilities, customCapabilities, capabilityOverrides]);

  const orderedCapabilities = useMemo(() => {
    const orderIndex = new Map(
      capabilityOrder.map((id, index) => [id, index] as const)
    );

    return [...mergedCapabilities].sort((left, right) => {
      const leftIndex = orderIndex.get(left.id);
      const rightIndex = orderIndex.get(right.id);

      if (leftIndex === undefined && rightIndex === undefined) {
        return left.name.localeCompare(right.name, "tr-TR");
      }

      if (leftIndex === undefined) return 1;
      if (rightIndex === undefined) return -1;
      return leftIndex - rightIndex;
    });
  }, [mergedCapabilities, capabilityOrder]);

  useEffect(() => {
    const knownIds = new Set(mergedCapabilities.map((item) => item.id));
    const mergedIds = mergedCapabilities.map((item) => item.id);
    const preservedOrder = capabilityOrder.filter((id) => knownIds.has(id));
    const missingIds = mergedIds.filter((id) => !preservedOrder.includes(id));
    const nextOrder = [...preservedOrder, ...missingIds];

    if (nextOrder.length !== capabilityOrder.length || missingIds.length > 0) {
      setCapabilityOrder(nextOrder);
    }
  }, [mergedCapabilities, capabilityOrder]);

  const activeCapabilities = useMemo(
    () =>
      orderedCapabilities.filter(
        (capability) => !capability.isArchived && !capability.isPaused
      ),
    [orderedCapabilities]
  );

  const pausedCapabilities = useMemo(
    () =>
      orderedCapabilities.filter(
        (capability) => !capability.isArchived && capability.isPaused
      ),
    [orderedCapabilities]
  );

  const archivedCapabilities = useMemo(
    () => orderedCapabilities.filter((capability) => capability.isArchived),
    [orderedCapabilities]
  );

  const capabilityResearchTarget = useMemo(
    () =>
      capabilityResearchTargetId
        ? mergedCapabilities.find((capability) => capability.id === capabilityResearchTargetId) ||
          null
        : null,
    [capabilityResearchTargetId, mergedCapabilities]
  );

  const capabilityResearchLinks = useMemo(
    () =>
      capabilityResearchTarget
        ? buildCapabilityResearchLinks(capabilityResearchTarget)
        : [],
    [capabilityResearchTarget]
  );

  const pendingLibrarySuggestionsForTarget = useMemo(
    () =>
      capabilityResearchTarget
        ? capabilityLibraryPending.filter(
            (item) => item.capabilityId === capabilityResearchTarget.id
          )
        : [],
    [capabilityResearchTarget, capabilityLibraryPending]
  );

  const masterPlanPreview = useMemo(
    () =>
      buildContinuationPlan({
        isLicensed,
        ollamaStatus,
        model,
        availableModels,
        activePack,
        capabilityDevelopment,
        upgradeEngineReport,
        personaProfile,
        continuationMode,
      }),
    [
      isLicensed,
      ollamaStatus,
      model,
      availableModels,
      activePack,
      capabilityDevelopment,
      upgradeEngineReport,
      personaProfile,
      continuationMode,
    ]
  );

  function requireProductOn(actionName: string) {
    if (productEnabledRef.current) {
      return true;
    }

    setProductStatusMessage(`${actionName} çalıştırılamadı. Ürün kapalı.`);
    addActivityLog(`${actionName} engellendi. Ürün kapalı.`, "warn");
    return false;
  }

  function requireOnlineAccess(actionName: string) {
    if (onlineAccessEnabled) {
      return true;
    }

    setProductStatusMessage(
      `${actionName} çalıştırılamadı. Online erişim kapalı (yalnızca admin açabilir).`
    );
    addActivityLog(`${actionName} engellendi. Online erişim kapalı.`, "warn");
    return false;
  }

  const orderedUpgradeStages = useMemo(() => {
    const orderIndex = new Map(
      upgradeStageOrder.map((id, index) => [id, index] as const)
    );

    return [...upgradeStages].sort((left, right) => {
      const leftIndex = orderIndex.get(left.id);
      const rightIndex = orderIndex.get(right.id);

      if (leftIndex === undefined && rightIndex === undefined) {
        return left.id.localeCompare(right.id, "tr-TR");
      }

      if (leftIndex === undefined) return 1;
      if (rightIndex === undefined) return -1;
      return leftIndex - rightIndex;
    });
  }, [upgradeStageOrder]);

  useEffect(() => {
    const knownIds = new Set(upgradeStages.map((item) => item.id));
    const stageIds = upgradeStages.map((item) => item.id);
    const preservedOrder = upgradeStageOrder.filter((id) => knownIds.has(id));
    const missingIds = stageIds.filter((id) => !preservedOrder.includes(id));
    const nextOrder = [...preservedOrder, ...missingIds];

    if (nextOrder.length !== upgradeStageOrder.length || missingIds.length > 0) {
      setUpgradeStageOrder(nextOrder);
    }
  }, [upgradeStageOrder]);

  async function checkOllama() {
    if (!requireProductOn("Ollama bağlantısı")) return;
    addActivityLog("Ollama bağlantısı kontrol ediliyor...", "info");
    setOllamaStatus("unknown");

    try {
      const models = await requestOllamaModels();
      if (!productEnabledRef.current) return;

      setAvailableModels(models);
      setOllamaStatus("online");
      addActivityLog(`Ollama bağlı. ${models.length} model bulundu.`, "success");

      const modelExists = models.some((item: OllamaModel) => item.name === model);
      if (!modelExists && models[0]?.name) {
        setModel(models[0].name);
        addActivityLog(`Aktif model güncellendi: ${models[0].name}`, "info");
      }
    } catch {
      if (!productEnabledRef.current) return;
      setOllamaStatus("offline");
      setAvailableModels([]);
      addActivityLog("Ollama'ya bağlanılamadı.", "error");
    }
  }

  async function findInstalledModel(failedModel: string) {
    const models = await requestOllamaModels();
    if (!productEnabledRef.current) return null;

    setAvailableModels(models);
    setOllamaStatus("online");

    const existingModel = models.find((item) => item.name === failedModel);
    const fallbackModel = existingModel?.name || models[0]?.name || null;

    if (fallbackModel && fallbackModel !== failedModel) {
      setModel(fallbackModel);
    }

    return fallbackModel;
  }

  async function importCorePackFile(file: File) {
    if (!requireProductOn("Paket yükleme")) return;
    addActivityLog(`Paket okunuyor: ${file.name}`, "info");
    setPackLoadStatus("");
    setPackLoadError("");

    try {
      const zip = await JSZip.loadAsync(file);
      if (!productEnabledRef.current) return;

      const manifestEntry = findZipFileEntry(zip, "manifest.json");
      if (!manifestEntry) {
        throw new Error("MANIFEST_NOT_FOUND");
      }

      const manifestText = await manifestEntry.async("string");
      if (!productEnabledRef.current) return;

      let manifest: CorePackManifest;
      try {
        const parsedManifest = JSON.parse(manifestText) as unknown;
        manifest = validateCorePackManifest(parsedManifest);
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw new Error("MANIFEST_INVALID_JSON");
        }
        throw error;
      }

      const fallbackName = file.name.replace(/\.(corepack|zip)$/i, "").trim();
      const packName =
        typeof manifest.name === "string" && manifest.name.trim()
          ? manifest.name.trim()
          : fallbackName || "Imported Pack";

      const requestedPromptPath =
        typeof manifest.entryPrompt === "string" && manifest.entryPrompt.trim()
          ? manifest.entryPrompt.trim()
          : "system_prompt.md";

      const promptPath = sanitizeCorePackEntryPath(requestedPromptPath);
      if (!promptPath) {
        throw new Error("MANIFEST_INVALID_ENTRY_PROMPT");
      }

      const promptEntry =
        findZipFileEntry(zip, promptPath) || findZipFileEntry(zip, "system_prompt.md");

      if (!promptEntry) {
        throw new Error("PROMPT_NOT_FOUND");
      }

      const promptText = (await promptEntry.async("string")).trim();
      if (!productEnabledRef.current) return;
      if (!promptText) {
        throw new Error("PROMPT_EMPTY");
      }

      const requestedId =
        typeof manifest.id === "string" && manifest.id.trim()
          ? manifest.id.trim()
          : packName;

      const baseId = normalizePackId(requestedId) || "imported-pack";

      const bundledIds = new Set(corePackProfiles.map((pack) => pack.id));
      const usedIds = new Set(
        [...corePackProfiles, ...importedPacks].map((pack) => pack.id)
      );
      const finalId = bundledIds.has(baseId)
        ? resolveUniquePackId(baseId, usedIds)
        : baseId;

      const importedPack: CorePackProfile = {
        id: finalId,
        name: packName,
        type:
          typeof manifest.type === "string" && manifest.type.trim()
            ? manifest.type.trim()
            : "Imported Pack",
        description:
          typeof manifest.description === "string" && manifest.description.trim()
            ? manifest.description.trim()
            : ".corepack dosyasından içe aktarılan özel paket.",
        prompt: promptText,
        source: "imported",
      };

      setImportedPacks((current) => {
        const withoutSameId = current.filter((pack) => pack.id !== importedPack.id);
        return [...withoutSameId, importedPack];
      });

      setActivePackId(importedPack.id);
      setPackLoadStatus(`Paket yüklendi ve aktif edildi: ${importedPack.name}`);
      addActivityLog(`Paket yüklendi: ${importedPack.name}`, "success");
    } catch (error) {
      if (!productEnabledRef.current) return;
      const code = error instanceof Error ? error.message : "UNKNOWN";

      const messageByCode: Record<string, string> = {
        MANIFEST_NOT_FOUND: "Paket içinde manifest.json bulunamadı.",
        PROMPT_NOT_FOUND:
          "Paket prompt dosyası bulunamadı. manifest entryPrompt veya system_prompt.md gerekli.",
        PROMPT_EMPTY: "Paket prompt dosyası boş görünüyor.",
      };

      setPackLoadError(
        messageByCode[code] || "Paket yüklenemedi. .corepack dosyasını kontrol edelim."
      );
      addActivityLog("Paket yüklenemedi.", "error");
    }
  }

  async function importCorePackFileValidated(file: File) {
    if (!requireProductOn("Paket yükleme")) return;
    addActivityLog(`Paket okunuyor: ${file.name}`, "info");
    setPackLoadStatus("");
    setPackLoadError("");

    try {
      const zip = await JSZip.loadAsync(file);
      if (!productEnabledRef.current) return;

      const manifestEntry = findZipFileEntry(zip, "manifest.json");
      if (!manifestEntry) {
        throw new Error("MANIFEST_NOT_FOUND");
      }

      const manifestText = await manifestEntry.async("string");
      if (!productEnabledRef.current) return;

      let manifest: CorePackManifest;
      try {
        const parsedManifest = JSON.parse(manifestText) as unknown;
        manifest = validateCorePackManifest(parsedManifest);
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw new Error("MANIFEST_INVALID_JSON");
        }
        throw error;
      }

      const fallbackName = file.name.replace(/\.(corepack|zip)$/i, "").trim();
      const packName =
        typeof manifest.name === "string" && manifest.name.trim()
          ? manifest.name.trim()
          : fallbackName || "Imported Pack";

      const requestedPromptPath =
        typeof manifest.entryPrompt === "string" && manifest.entryPrompt.trim()
          ? manifest.entryPrompt.trim()
          : "system_prompt.md";

      const promptPath = sanitizeCorePackEntryPath(requestedPromptPath);
      if (!promptPath) {
        throw new Error("MANIFEST_INVALID_ENTRY_PROMPT");
      }

      const promptEntry =
        findZipFileEntry(zip, promptPath) || findZipFileEntry(zip, "system_prompt.md");

      if (!promptEntry) {
        throw new Error("PROMPT_NOT_FOUND");
      }

      const promptText = (await promptEntry.async("string")).trim();
      if (!productEnabledRef.current) return;
      if (!promptText) {
        throw new Error("PROMPT_EMPTY");
      }

      const requestedId =
        typeof manifest.id === "string" && manifest.id.trim() ? manifest.id.trim() : packName;

      const baseId = normalizePackId(requestedId) || "imported-pack";

      const bundledIds = new Set(corePackProfiles.map((pack) => pack.id));
      const usedIds = new Set(
        [...corePackProfiles, ...importedPacks].map((pack) => pack.id)
      );
      const finalId = bundledIds.has(baseId)
        ? resolveUniquePackId(baseId, usedIds)
        : baseId;

      const importedPack: CorePackProfile = {
        id: finalId,
        name: packName,
        type:
          typeof manifest.type === "string" && manifest.type.trim()
            ? manifest.type.trim()
            : "Imported Pack",
        description:
          typeof manifest.description === "string" && manifest.description.trim()
            ? manifest.description.trim()
            : ".corepack dosyasından içe aktarılan özel paket.",
        prompt: promptText,
        source: "imported",
      };

      setImportedPacks((current) => {
        const withoutSameId = current.filter((pack) => pack.id !== importedPack.id);
        return [...withoutSameId, importedPack];
      });

      setActivePackId(importedPack.id);
      setPackLoadStatus(`Paket yüklendi ve aktif edildi: ${importedPack.name}`);
      addActivityLog(`Paket yüklendi: ${importedPack.name}`, "success");
    } catch (error) {
      if (!productEnabledRef.current) return;
      const code = error instanceof Error ? error.message.split(":")[0] : "UNKNOWN";

      const messageByCode: Record<string, string> = {
        MANIFEST_NOT_FOUND: "Paket içinde manifest.json bulunamadı.",
        MANIFEST_INVALID_JSON: "manifest.json geçerli JSON formatında değil.",
        MANIFEST_INVALID_SCHEMA:
          "manifest.json şeması geçersiz. Alan tiplerini ve boş değerleri kontrol et.",
        MANIFEST_INVALID_ENTRY_PROMPT:
          "manifest entryPrompt değeri geçersiz. Güvenli bir relatif dosya yolu kullan.",
        PROMPT_NOT_FOUND:
          "Paket prompt dosyası bulunamadı. manifest entryPrompt veya system_prompt.md gerekli.",
        PROMPT_EMPTY: "Paket prompt dosyası boş görünüyor.",
      };

      setPackLoadError(
        messageByCode[code] || "Paket yüklenemedi. .corepack dosyasını kontrol edelim."
      );
      addActivityLog("Paket yüklenemedi.", "error");
    }
  }

  function removeImportedPack(packId: string) {
    if (!requireProductOn("Paket kaldırma")) return;
    setImportedPacks((current) => current.filter((pack) => pack.id !== packId));

    if (activePackId === packId) {
      setActivePackId("");
      setPackLoadStatus("Aktif imported paket kaldırıldı.");
    }
    addActivityLog("İçe aktarılan paket kaldırıldı.", "warn");
  }

  function addCustomPack() {
    if (!requireProductOn("Özel paket ekleme")) return;

    const cleanName = customPackName.trim();
    const cleanType = customPackType.trim();
    const cleanDescription = customPackDescription.trim();
    const cleanPrompt = customPackPrompt.trim();

    setCustomPackMessage("");
    setCustomPackError("");

    if (!cleanName) {
      setCustomPackError("Paket adı gerekli.");
      return;
    }

    if (!cleanPrompt) {
      setCustomPackError("Paket promptu gerekli.");
      return;
    }

    const baseId = normalizePackId(cleanName) || "custom-pack";
    const usedIds = new Set(
      [...corePackProfiles, ...importedPacks, ...customPacks].map((pack) => pack.id)
    );
    const finalId = resolveUniquePackId(baseId, usedIds);

    const duplicateName = [...corePackProfiles, ...importedPacks, ...customPacks].some(
      (pack) => normalizePackId(pack.name) === normalizePackId(cleanName)
    );

    if (duplicateName) {
      setCustomPackError("Bu paket adı zaten listede görünüyor.");
      return;
    }

    const customPack: CorePackProfile = {
      id: finalId,
      name: cleanName,
      type: cleanType || "Custom",
      description:
        cleanDescription ||
        "Kullanıcı tarafından yerelde tanımlanan özel paket.",
      prompt: cleanPrompt,
      source: "custom",
    };

    setCustomPacks((current) => [...current, customPack]);
    setActivePackId(customPack.id);
    setCustomPackName("");
    setCustomPackType("");
    setCustomPackDescription("");
    setCustomPackPrompt("");
    setPackLoadStatus(`Özel paket eklendi ve aktif edildi: ${customPack.name}`);
    addActivityLog(`Özel paket eklendi: ${customPack.name}`, "success");
  }

  function appendAutomationAudit(entry: AutomationAuditEntry) {
    setAutomationAudit((current) => [entry, ...current].slice(0, 140));
  }

  function appendEngineDiagnostic(report: EngineDiagnosticReport) {
    setEngineDiagnostics((current) => [report, ...current].slice(0, 220));
  }

  function appendPackTraceText(base: string, line: string) {
    const cleanBase = base.trim();
    if (!cleanBase) return line;
    if (cleanBase.includes(line)) return cleanBase;
    return `${cleanBase}\n${line}`;
  }

  function appendPackAutomationTrail(
    packId: string,
    note: string,
    operationId?: string
  ) {
    const stamp = new Date().toISOString();
    const trailLine = `[${stamp}] ${note}`;
    const trailSuffix = ` | Son otomasyon: ${stamp}`;

    if (customPacks.some((pack) => pack.id === packId)) {
      setCustomPacks((current) =>
        current.map((pack) =>
          pack.id === packId
            ? {
                ...pack,
                description: `${pack.description}${trailSuffix}`,
                prompt: appendPackTraceText(pack.prompt, trailLine),
              }
            : pack
        )
      );
      setPackLoadStatus("Paket iz kaydı güncellendi.");
      addActivityLog("Paket prompt/meta izi güncellendi.", "info", operationId);
      return;
    }

    if (importedPacks.some((pack) => pack.id === packId)) {
      setImportedPacks((current) =>
        current.map((pack) =>
          pack.id === packId
            ? {
                ...pack,
                description: `${pack.description}${trailSuffix}`,
                prompt: appendPackTraceText(pack.prompt, trailLine),
              }
            : pack
        )
      );
      setPackLoadStatus("İçeri aktarılan paketin iz kaydı güncellendi.");
      addActivityLog("Import pakette otomasyon izi güncellendi.", "info", operationId);
      return;
    }

    setPackLoadStatus("Bundled paketlerde prompt/meta yazimi kapali, iz kaydi sadece loga yazildi.");
    addActivityLog("Bundled paket oldugu icin paket metasi degistirilmedi.", "warn", operationId);
  }

  function inferUpgradeTarget(
    source: UpgradeActionSource,
    title: string,
    description: string,
    targetHint?: UpgradeApplyTarget
  ): UpgradeApplyTarget {
    if (targetHint) return targetHint;
    if (source === "pack") return "pack";
    if (source === "capability") return "capability";

    const haystack = `${title} ${description}`.toLowerCase();
    const packSignals = ["pack", "paket", "persona", "workflow", "module", "modül"];

    if (
      (source === "repository" || source === "coding") &&
      packSignals.some((item) => haystack.includes(item))
    ) {
      return "pack";
    }

    return "capability";
  }

  function runUpgradeAutomation({
    source,
    title,
    description,
    sourceUrl,
    targetHint,
  }: {
    source: UpgradeActionSource;
    title: string;
    description: string;
    sourceUrl?: string;
    targetHint?: UpgradeApplyTarget;
  }) {
    if (!requireProductOn("Yükselt otomasyonu")) return null;

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    if (!cleanTitle) {
      appendEngineDiagnostic({
        runAt: new Date().toISOString(),
        operationId: createRecordId("op"),
        source,
        action: "suggest",
        result: "error",
        errorCode: "UPGRADE_EMPTY_TITLE",
        note: "Öneri oluşturulamadı: başlık boş.",
      });
      return null;
    }

    const target = inferUpgradeTarget(source, cleanTitle, cleanDescription, targetHint);
    const suggestion: UpgradeSuggestionCard = {
      id: createRecordId("sug"),
      createdAt: new Date().toISOString(),
      source,
      title: cleanTitle,
      description:
        cleanDescription || "Araştırma sonucundan oluşturulan geliştirme önerisi.",
      sourceUrl,
      target,
    };

    setUpgradeSuggestionCard(suggestion);
    setUpgradeEngineMessage(`Öneri hazır: ${cleanTitle} -> ${target}`);

    const operationId = createRecordId("op");
    addActivityLog(
      `Öneri karti olusturuldu: ${cleanTitle} -> ${target}`,
      "info",
      operationId
    );
    appendAutomationAudit({
      id: createRecordId("audit"),
      at: new Date().toISOString(),
      source,
      action: "suggest",
      operationId,
      targetType: target,
      targetId: suggestion.id,
      result: "success",
      note: `Öneri olusturuldu: ${cleanTitle}`,
    });
    appendEngineDiagnostic({
      runAt: new Date().toISOString(),
      operationId,
      source,
      action: "suggest",
      result: "success",
      note: `Öneri kartı üretildi: ${cleanTitle} -> ${target}`,
    });
    if (sourceUrl) {
      registerOpenedSourcePreview({
        title: cleanTitle,
        url: sourceUrl,
        source,
        status: "queued",
        note: "Öneri kaynağı otomasyon kuyruğuna işlendi.",
        operationId,
      });
    }

    return suggestion;
  }

  function createCapabilityFromSuggestion(suggestion: UpgradeSuggestionCard) {
    const baseId = normalizeCapabilityId(suggestion.title) || "auto-capability";
    const usedIds = new Set(
      [...capabilities, ...customCapabilities].map((item) => item.id)
    );
    const finalId = usedIds.has(baseId)
      ? `${baseId}-${Date.now().toString(36)}`
      : baseId;
    const duplicateName = [...capabilities, ...customCapabilities].some(
      (item) =>
        normalizeCapabilityId(item.name) === normalizeCapabilityId(suggestion.title)
    );

    if (duplicateName) {
      return {
        result: "skipped" as const,
        targetId: finalId,
        targetName: suggestion.title,
        note: "Ayni isimde yetenek zaten var.",
      };
    }

    const autoCapability: CustomCapability = {
      id: finalId,
      name: suggestion.title,
      status: "planned",
      source: "module",
      description:
        suggestion.description || "Araştırma sonucundan oluşturulan yetenek.",
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    setCustomCapabilities((current) => [...current, autoCapability]);
    setCustomCapabilityMessage(`Otomatik yetenek eklendi: ${autoCapability.name}`);
    openHubTab("capabilities");

    return {
      result: "success" as const,
      targetId: autoCapability.id,
      targetName: autoCapability.name,
      note: "Yetenek eklendi.",
    };
  }

  function createPackFromSuggestion(suggestion: UpgradeSuggestionCard) {
    const baseId = normalizePackId(suggestion.title) || "auto-pack";
    const usedIds = new Set(
      [...corePackProfiles, ...importedPacks, ...customPacks].map((pack) => pack.id)
    );
    const finalId = resolveUniquePackId(baseId, usedIds);
    const duplicateName = [...corePackProfiles, ...importedPacks, ...customPacks].some(
      (pack) => normalizePackId(pack.name) === normalizePackId(suggestion.title)
    );

    if (duplicateName) {
      return {
        result: "skipped" as const,
        targetId: finalId,
        targetName: suggestion.title,
        note: "Ayni isimde paket zaten var.",
      };
    }

    const autoPack: CorePackProfile = {
      id: finalId,
      name: suggestion.title,
      type: "Auto",
      description: suggestion.description || "Araştırma sonucundan oluşturulan paket.",
      prompt: [
        `Paket adi: ${suggestion.title}`,
        suggestion.description ? `Amac: ${suggestion.description}` : "",
        suggestion.sourceUrl ? `Kaynak: ${suggestion.sourceUrl}` : "",
        `Otomasyon izi: ${new Date().toISOString()}`,
      ]
        .filter(Boolean)
        .join("\n"),
      source: "custom",
    };

    setCustomPacks((current) => [...current, autoPack]);
    setActivePackId(autoPack.id);
    setPackLoadStatus(`Otomatik paket eklendi: ${autoPack.name}`);
    openHubTab("packs");

    return {
      result: "success" as const,
      targetId: autoPack.id,
      targetName: autoPack.name,
      note: "Paket eklendi ve aktif edildi.",
    };
  }

  function applySuggestionByRule(suggestion: UpgradeSuggestionCard) {
    if (!requireProductOn("Öneri uygulama")) return null;
    const operationId = createRecordId("op");

    if (isTemporarySession) {
      queueTemporaryChange({
        source: suggestion.source,
        targetType: suggestion.target,
        targetId: suggestion.id,
        title: suggestion.title,
        description: suggestion.description,
        operationId,
      });
      appendAutomationAudit({
        id: createRecordId("audit"),
        at: new Date().toISOString(),
        source: suggestion.source,
        action: "apply",
        operationId,
        targetType: suggestion.target,
        targetId: suggestion.id,
        result: "skipped",
        note: "Geçici profilde doğrudan uygulama kapalı, onay kuyruğuna alındı.",
      });
      appendEngineDiagnostic({
        runAt: new Date().toISOString(),
        operationId,
        source: suggestion.source,
        action: "apply",
        result: "skipped",
        errorCode: "TEMP_PROFILE_QUEUE",
        note: "Uygulama geçici profile alındı ve admin onay kuyruğuna taşındı.",
      });
      setUpgradeEngineMessage(
        "Geçici profilde otomasyon doğrudan yazamaz; öneri admin onay kuyruğuna alındı."
      );
      setUpgradeSuggestionCard(null);
      return {
        result: "skipped" as const,
        targetId: suggestion.id,
        targetName: suggestion.title,
        note: "Geçici profilde uygulama kuyruğa alındı.",
        operationId,
        targetType: suggestion.target,
      };
    }

    const output =
      suggestion.target === "pack"
        ? createPackFromSuggestion(suggestion)
        : createCapabilityFromSuggestion(suggestion);

    addActivityLog(
      `Öneri uygulandi: ${suggestion.title} -> ${suggestion.target} (${output.result})`,
      output.result === "success" ? "success" : "warn",
      operationId
    );
    appendAutomationAudit({
      id: createRecordId("audit"),
      at: new Date().toISOString(),
      source: suggestion.source,
      action: "apply",
      operationId,
      targetType: suggestion.target,
      targetId: output.targetId,
      result: output.result,
      note: output.note,
    });
    appendEngineDiagnostic({
      runAt: new Date().toISOString(),
      operationId,
      source: suggestion.source,
      action: "apply",
      result: output.result,
      note: output.note,
    });

    setUpgradeEngineMessage(`Uygulama sonucu: ${output.note}`);
    setUpgradeSuggestionCard(null);
    return { ...output, operationId, targetType: suggestion.target };
  }

  function autoApplySuggestion(
    title: string,
    description: string,
    sourceUrl?: string,
    targetHint?: UpgradeApplyTarget,
    source: UpgradeActionSource = "capability"
  ) {
    runUpgradeAutomation({
      source,
      title,
      description,
      sourceUrl,
      targetHint,
    });
  }

  function scanPackSelfDevelopmentSources() {
    if (!requireProductOn("Paket gelisim kaynak tarama")) return;
    const signals: string[] = [];

    if (activePack) {
      signals.push(`Aktif paket: ${activePack.name}`);
      signals.push(`Paket turu: ${activePack.type}`);
    } else {
      signals.push("Aktif paket bulunmuyor.");
    }

    const topCapabilities = activeCapabilities.slice(0, 3).map((item) => item.name);
    if (topCapabilities.length > 0) {
      signals.push(`Oncelikli yetenekler: ${topCapabilities.join(", ")}`);
    }

    const lastLogs = activityLog.slice(0, 3).map((entry) => entry.message);
    if (lastLogs.length > 0) {
      signals.push(`Son akis: ${lastLogs.join(" | ")}`);
    }

    setPackSelfScanMessage(signals.join(" • "));
    setPackSelfDevMessage("Kaynak tarama tamamlandı. Şimdi önerileri üretebilirsin.");
    setPackSelfDevError("");
    addActivityLog("Paket gelisim kaynaklari tarandi.", "info");
  }

  function generatePackSelfDevelopmentTasks() {
    if (!requireProductOn("Paket gelişim önerisi")) return;
    if (!activePack) {
      setPackSelfDevError("Bu adım için önce bir aktif paket seç.");
      return;
    }

    const seed = activeCapabilities.slice(0, 3).map((item) => item.name);
    const nextTasks: PackSelfDevelopmentTask[] = [
      {
        id: createRecordId("psd"),
        createdAt: new Date().toISOString(),
        status: "draft",
        title: `${activePack.name} promptunu sadele_tir`,
        summary: "Paket promptunu aktif yeteneklere hizalayip daha net bir davranis tanimi uret.",
        sourceSignals: seed,
        suggestion: {
          id: createRecordId("sug"),
          createdAt: new Date().toISOString(),
          source: "pack",
          title: `${activePack.name} Refinement Pack`,
          description: "Mevcut paket promptunu sade ve net bir gorev diline tasiyan iyilestirme paketi.",
          target: "pack",
        },
      },
      {
        id: createRecordId("psd"),
        createdAt: new Date().toISOString(),
        status: "draft",
        title: "Eksik alt beceriyi capability olarak ekle",
        summary: "Paketin etkisini artiracak bir alt beceri yetenegini capability olarak kaydet.",
        sourceSignals: seed,
        suggestion: {
          id: createRecordId("sug"),
          createdAt: new Date().toISOString(),
          source: "pack",
          title: `${activePack.name} Assistant Skill`,
          description: "Paket akışında tekrar eden bir görevi otomatikleştiren destek yeteneği.",
          target: "capability",
        },
      },
    ];

    setPackSelfDevTasks((current) => [...nextTasks, ...current].slice(0, 24));
    setPackSelfDevMessage("Paket gelişim önerileri üretildi. Uygula ile onaylı ilerleyebilirsin.");
    setPackSelfDevError("");
    addActivityLog("Paket gelişim önerileri üretildi.", "success");
  }

  function runPackSelfDevelopment(taskId: string) {
    if (!requireProductOn("Paket gelisim uygulama")) return;
    const task = packSelfDevTasks.find((item) => item.id === taskId);
    if (!task) {
      appendEngineDiagnostic({
        runAt: new Date().toISOString(),
        operationId: createRecordId("op"),
        source: "pack-self-dev",
        action: "apply",
        result: "error",
        errorCode: "PACK_TASK_NOT_FOUND",
        note: `Paket görev id bulunamadı: ${taskId}`,
      });
      return;
    }

    const suggestion = runUpgradeAutomation({
      source: "pack",
      title: task.suggestion.title,
      description: task.suggestion.description,
      targetHint: task.suggestion.target,
    });
    if (!suggestion) {
      appendEngineDiagnostic({
        runAt: new Date().toISOString(),
        operationId: createRecordId("op"),
        source: "pack-self-dev",
        action: "apply",
        result: "error",
        errorCode: "PACK_SUGGESTION_FAILED",
        note: `Paket görevi için öneri üretilemedi: ${task.title}`,
      });
      return;
    }

    const applied = applySuggestionByRule(suggestion);
    if (!applied) {
      appendEngineDiagnostic({
        runAt: new Date().toISOString(),
        operationId: createRecordId("op"),
        source: "pack-self-dev",
        action: "apply",
        result: "error",
        errorCode: "PACK_APPLY_FAILED",
        note: `Paket görevi uygulanamadı: ${task.title}`,
      });
      return;
    }

    if (activePack?.id) {
      appendPackAutomationTrail(
        activePack.id,
        `Kendini geliştirme görevi uygulandı: ${task.title}`,
        applied.operationId
      );
    }

    setPackSelfDevTasks((current) =>
      current.map((item) =>
        item.id === taskId ? { ...item, status: "applied" } : item
      )
    );
    appendAutomationAudit({
      id: createRecordId("audit"),
      at: new Date().toISOString(),
      source: "pack-self-dev",
      action: "apply",
      operationId: applied.operationId,
      targetType: task.suggestion.target,
      targetId: applied.targetId,
      result: applied.result,
      note: `Paket gelişim görevi uygulandı: ${task.title}. Sonuç: ${applied.note}`,
    });
    setPackSelfDevMessage(`Paket gelisim uygulandi: ${task.title}`);
    appendEngineDiagnostic({
      runAt: new Date().toISOString(),
      operationId: applied.operationId,
      source: "pack-self-dev",
      action: "apply",
      result: applied.result,
      note: `Paket görevi tamamlandı: ${task.title}`,
    });
  }

  async function generatePackDraftFromModel() {
    if (!requireProductOn("LLM paket taslağı")) return;
    if (isRestricted) {
      setPackDraftError("Lisans geçerli değil. LLM ile paket üretimi kapalı.");
      return;
    }

    const idea = packIdea.trim();
    if (!idea) {
      setPackDraftError("Önce paket fikrini yaz.");
      return;
    }

    setPackDraftLoading(true);
    setPackDraftMessage("");
    setPackDraftError("");
    addActivityLog("LLM ile paket taslağı üretiliyor...", "info");

    try {
      const system = `
Return only valid JSON.
Generate a OC package draft for a local/offline assistant.
The output must be in Turkish.
Schema:
{
  "name": "string",
  "type": "string",
  "description": "string",
  "prompt": "string"
}
Rules:
- Keep it practical, safe, and locally usable.
- Make the name concise and product-ready.
- Make the prompt a short system prompt suitable for a .corepack package.
- Do not include markdown, code fences, or extra keys.
`.trim();

      const reply = await requestModelText(
        [{ role: "user", content: idea }],
        model,
        system
      );

      if (!productEnabledRef.current) return;

      const parsed = extractJsonPayload(reply);
      const generatedName = String(parsed.name || "").trim();
      const generatedType = String(parsed.type || "").trim();
      const generatedDescription = String(parsed.description || "").trim();
      const generatedPrompt = String(parsed.prompt || "").trim();

      if (!generatedName || !generatedPrompt) {
        throw new Error("INVALID_JSON");
      }

      setCustomPackName(generatedName);
      setCustomPackType(generatedType || "Custom");
      setCustomPackDescription(generatedDescription);
      setCustomPackPrompt(generatedPrompt);
      setPackDraftMessage("LLM paket taslağı forma aktarıldı.");
      addActivityLog("LLM paket taslağı üretildi ve forma aktarıldı.", "success");
    } catch (error) {
      if (!productEnabledRef.current) return;
      const code = error instanceof Error ? error.message : "UNKNOWN";
      setPackDraftError(
        code === "MODEL_NOT_FOUND"
          ? "Seçili model bulunamadı. Modeli kontrol edelim."
          : code === "INVALID_JSON"
          ? "Model düzgün JSON döndürmedi. Fikri biraz sadeleştirip tekrar dene."
          : "Paket taslağı üretilemedi."
      );
      addActivityLog("LLM paket taslağı üretilemedi.", "error");
    } finally {
      setPackDraftLoading(false);
    }
  }

  function removeCustomPack(packId: string) {
    if (!requireProductOn("Özel paket kaldırma")) return;

    setCustomPacks((current) => current.filter((pack) => pack.id !== packId));

    if (activePackId === packId) {
      setActivePackId("");
      setPackLoadStatus("Aktif özel paket kaldırıldı.");
    }
    addActivityLog("Özel paket kaldırıldı.", "warn");
  }

  useEffect(() => {
    if (productEnabledRef.current) {
      checkOllama();
    }
  }, []);

  function validateLicense() {
    if (!requireProductOn("Lisans doğrulama")) return;
    addActivityLog("Lisans doğrulanıyor...", "info");
    const cleanToken = licenseToken.trim();

    if (!eulaAccepted || !privacyAccepted) {
      setLicenseStatus("restricted");
      return;
    }

    if (!cleanToken) {
      setLicenseStatus("missing");
      addActivityLog("Lisans doğrulama için token eksik.", "warn");
      return;
    }

    if (cleanToken.startsWith("COREI-")) {
      setLicenseStatus("valid");
      addActivityLog("Lisans doğrulandı.", "success");
      return;
    }

    setLicenseStatus("invalid");
    addActivityLog("Lisans geçersiz.", "error");
  }

  function activateDevLicense() {
    if (!requireProductOn("Dev lisans etkinleştirme")) return;
    setEulaAccepted(true);
    setPrivacyAccepted(true);
    setTelemetryAccepted(false);
    setLicenseToken("COREI-DEV-LOCAL-0001");
    setLicenseStatus("valid");
    addActivityLog("Dev lisansı etkinleştirildi.", "success");
  }

  function resetLicense() {
    if (!requireProductOn("Lisans sıfırlama")) return;
    setLicenseToken("");
    setLicenseStatus("missing");
    setEulaAccepted(false);
    setPrivacyAccepted(false);
    setTelemetryAccepted(false);
    addActivityLog("Lisans sıfırlandı.", "warn");
  }

  function clearLocalMemory() {
    if (!requireProductOn("Yerel hafıza temizleme")) return;
    if (!isAdmin) {
      setMemoryAdminError("Ayar değişiklikleri yalnızca admin tarafından yapılabilir.");
      return;
    }
    localStorage.removeItem(STORAGE_KEYS.chatHistory);
    setMessages(defaultMessages);
    setChatMemoryExcludedTopics([]);
    setMemoryTopicSearch("");
    setMemoryTopicMenuOpenKey(null);
    setMemoryAdminError("");
    setMemoryAdminMessage("Tüm sohbet hafızası temizlendi.");
    addActivityLog("Yerel sohbet hafızası temizlendi.", "warn");
  }

  function toggleLearningFromUserSetting() {
    if (!requireProductOn("Kullanıcıdan öğrenme ayarı")) return;
    if (!isAdmin) return;
    setLearningFromUser((current) => !current);
  }

  function toggleCreativeStyleLearningSetting() {
    if (!requireProductOn("Yaratıcı stil öğrenme ayarı")) return;
    if (!isAdmin) return;
    setCreativeStyleLearning((current) => !current);
  }

  function toggleCapabilityDevelopmentSetting() {
    if (!requireProductOn("Yetenek geliştirme ayarı")) return;
    if (!isAdmin) return;
    setCapabilityDevelopment((current) => !current);
  }

  function toggleTrendAwareRepliesSetting() {
    if (!requireProductOn("Trend farkındalığı ayarı")) return;
    if (!isAdmin) return;
    setTrendAwareReplies((current) => !current);
  }

  function toggleOnlineAccessSetting() {
    if (!requireProductOn("Online erişim ayarı")) return;
    if (!isAdmin) return;
    setOnlineAccessEnabled((current) => !current);
    addActivityLog(
      onlineAccessEnabled
        ? "Online erişim kapatıldı (offline mod öncelikli)."
        : "Online erişim açıldı.",
      "info"
    );
  }

  function applyModelSelection(nextModel: string, sourceLabel: string) {
    if (!requireProductOn("Model seçimi")) return;
    const cleanModel = nextModel.trim();
    if (!cleanModel) return;

    if (isTemporarySession) {
      queueTemporaryChange({
        source: "upgrade-stage",
        targetType: "capability",
        targetId: `model:${cleanModel}`,
        title: `Model değişikliği: ${cleanModel}`,
        description: `Geçici profil model değişikliği talebi (${sourceLabel})`,
      });
      setAuthMessage(
        "Geçici profilde model değişikliği doğrudan uygulanmaz; admin onayına gönderildi."
      );
      return;
    }

    setModel(cleanModel);
    addActivityLog(`Aktif model güncellendi: ${cleanModel}`, "info");
  }

  function buildChatContextMessages(sourceMessages: Message[]) {
    if (chatMemoryExcludedTopics.length === 0) return sourceMessages;

    const excluded = new Set(chatMemoryExcludedTopics);
    return sourceMessages.filter((message, index, allMessages) => {
      if (message.role === "user") {
        const key = buildChatMemoryTopicKey(message.content);
        return !(key && excluded.has(key));
      }

      const previous = allMessages[index - 1];
      if (!previous || previous.role !== "user") return true;
      const previousKey = buildChatMemoryTopicKey(previous.content);
      return !(previousKey && excluded.has(previousKey));
    });
  }

  function removeMemoryTopicByKey(topicKey: string) {
    if (!requireProductOn("Hafıza başlığı kaldırma")) return;
    if (!isAdmin) {
      setMemoryAdminError("Bu işlem yalnızca admin tarafından yapılabilir.");
      return;
    }

    let removedCount = 0;
    setMessages((current) => {
      const removeUserIndexes = new Set<number>();
      current.forEach((message, index) => {
        if (message.role !== "user") return;
        if (buildChatMemoryTopicKey(message.content) === topicKey) {
          removeUserIndexes.add(index);
        }
      });

      if (removeUserIndexes.size === 0) {
        return current;
      }

      const removeIndexes = new Set<number>();
      removeUserIndexes.forEach((index) => {
        removeIndexes.add(index);
        const nextMessage = current[index + 1];
        if (nextMessage && nextMessage.role === "assistant") {
          removeIndexes.add(index + 1);
        }
      });

      removedCount = removeIndexes.size;
      const nextMessages = current.filter((_, index) => !removeIndexes.has(index));
      if (!nextMessages.some((message) => message.role === "user")) {
        return defaultMessages;
      }
      return nextMessages;
    });

    if (removedCount > 0) {
      setChatMemoryExcludedTopics((current) =>
        current.filter((item) => item !== topicKey)
      );
      setMemoryTopicMenuOpenKey(null);
      setMemoryAdminError("");
      setMemoryAdminMessage(`Seçilen başlık kaldırıldı. Silinen kayıt: ${removedCount}`);
      addActivityLog(`Hafıza başlığı kaldırıldı: ${topicKey}`, "warn");
      return;
    }

    setMemoryAdminError("Seçilen başlığa ait kayıt bulunamadı.");
  }

  function toggleTopicContextExclusion(topic: ChatMemoryTopic) {
    if (!requireProductOn("Hafıza bağlam ayarı")) return;
    if (!isAdmin) {
      setMemoryAdminError("Bu işlem yalnızca admin tarafından yapılabilir.");
      return;
    }

    const isExcluded = chatMemoryExcludedTopics.includes(topic.key);
    setChatMemoryExcludedTopics((current) => {
      if (isExcluded) {
        return current.filter((item) => item !== topic.key);
      }
      return [...current, topic.key];
    });

    setMemoryTopicMenuOpenKey(null);
    setMemoryAdminError("");
    setMemoryAdminMessage(
      isExcluded
        ? "Başlık tekrar bağlama dahil edildi."
        : "Başlık bağlam dışına alındı. Sohbet kaydı korunur ama gelecekteki kararları etkilemez."
    );
    addActivityLog(
      isExcluded
        ? `Başlık bağlama tekrar dahil edildi: ${topic.key}`
        : `Başlık bağlam dışına alındı: ${topic.key}`,
      "info"
    );
  }

  function closeCapabilityMenu() {
    setCapabilityMenuOpenId(null);
  }

  function openCapabilityMenu(capability: CapabilityCard) {
    if (!requireProductOn("Yetenek menüsü")) return;
    setCapabilityActionMessage("");
    setCapabilityActionError("");
    setCapabilityMenuOpenId((current) =>
      current === capability.id ? null : capability.id
    );
  }

  function startEditingCapability(capability: CapabilityCard) {
    if (!requireProductOn("Yetenek düzenleme")) return;
    setEditingCapabilityId(capability.id);
    setEditingCapabilityName(capability.name);
    setEditingCapabilityDescription(capability.description);
    setCapabilityMenuOpenId(null);
    setCapabilityActionMessage("");
    setCapabilityActionError("");
  }

  function saveCapabilityEdit() {
    if (!requireProductOn("Yetenek kaydetme")) return;
    if (!editingCapabilityId) return;

    const cleanName = editingCapabilityName.trim();
    const cleanDescription = editingCapabilityDescription.trim();

    if (!cleanName) {
      setCapabilityActionError("Yetenek başlığı boş bırakılamaz.");
      return;
    }

    if (isTemporarySession) {
      queueTemporaryChange({
        source: "capability",
        targetType: "capability",
        targetId: editingCapabilityId,
        title: cleanName,
        description: cleanDescription || "Yetenek düzenleme",
      });
      setCapabilityActionMessage(
        "Geçici profilde düzenleme doğrudan uygulanmaz; admin onay kuyruğuna alındı."
      );
      setEditingCapabilityId(null);
      return;
    }

    const normalized = normalizeCapabilityDisplay(cleanName, cleanDescription);

    setCapabilityOverrides((current) => ({
      ...current,
      [editingCapabilityId]: {
        ...(current[editingCapabilityId] || {
          updatedAt: new Date().toISOString(),
        }),
        name: normalized.name,
        description: normalized.description || cleanDescription,
        updatedAt: new Date().toISOString(),
      },
    }));

    setCapabilityActionMessage("Yetenek düzenlendi.");
    setEditingCapabilityId(null);
    addActivityLog("Yetenek düzenlendi.", "success");
  }

  function tidyCapability(capabilityId: string) {
    if (!requireProductOn("Yetenek metni düzenleme")) return;
    const capability = mergedCapabilities.find((item) => item.id === capabilityId);
    if (!capability) return;

    if (isTemporarySession) {
      queueTemporaryChange({
        source: "capability",
        targetType: "capability",
        targetId: capabilityId,
        title: capability.name,
        description: "Yetenek metnini UI diline uygun hale getirme",
      });
      setCapabilityActionMessage(
        "Geçici profilde bu işlem admin onay kuyruğuna alındı."
      );
      setCapabilityMenuOpenId(null);
      return;
    }

    const normalized = normalizeCapabilityDisplay(
      capability.name,
      capability.description
    );

    setCapabilityOverrides((current) => ({
      ...current,
      [capabilityId]: {
        ...(current[capabilityId] || { updatedAt: new Date().toISOString() }),
        name: normalized.name,
        description: normalized.description,
        updatedAt: new Date().toISOString(),
      },
    }));

    setCapabilityActionMessage("Yetenek metni UI diline uygun hale getirildi.");
    setCapabilityMenuOpenId(null);
    addActivityLog("Yetenek metni UI diline uygun hale getirildi.", "success");
  }

  function toggleCapabilityArchive(capabilityId: string) {
    if (!requireProductOn("Yetenek arşivleme")) return;
    const capability = mergedCapabilities.find((item) => item.id === capabilityId);
    if (!capability) return;

    if (isTemporarySession) {
      queueTemporaryChange({
        source: "capability",
        targetType: "capability",
        targetId: capabilityId,
        title: capability.name,
        description: "Yetenek arşiv durumu değişikliği",
      });
      setCapabilityActionMessage(
        "Geçici profilde arşivleme işlemi admin onayına gönderildi."
      );
      setCapabilityMenuOpenId(null);
      return;
    }

    const nextArchived = !capability.isArchived;
    setCapabilityOverrides((current) => ({
      ...current,
      [capabilityId]: {
        ...(current[capabilityId] || { updatedAt: new Date().toISOString() }),
        isArchived: nextArchived,
        updatedAt: new Date().toISOString(),
      },
    }));

    setCapabilityActionMessage(
      nextArchived ? "Yetenek arşivlendi." : "Yetenek arşivden çıkarıldı."
    );
    setCapabilityMenuOpenId(null);
    addActivityLog(
      nextArchived ? "Yetenek arşivlendi." : "Yetenek arşivden çıkarıldı.",
      nextArchived ? "warn" : "info"
    );
  }

  function toggleCapabilityPause(capabilityId: string) {
    if (!requireProductOn("Yetenek pasifleştirme")) return;
    const capability = mergedCapabilities.find((item) => item.id === capabilityId);
    if (!capability) return;

    if (isTemporarySession) {
      queueTemporaryChange({
        source: "capability",
        targetType: "capability",
        targetId: capabilityId,
        title: capability.name,
        description: "Yetenek pasif/aktif değişikliği",
      });
      setCapabilityActionMessage(
        "Geçici profilde pasif/aktif değişikliği onay kuyruğuna alındı."
      );
      setCapabilityMenuOpenId(null);
      return;
    }

    const nextPaused = !capability.isPaused;
    setCapabilityOverrides((current) => ({
      ...current,
      [capabilityId]: {
        ...(current[capabilityId] || { updatedAt: new Date().toISOString() }),
        isPaused: nextPaused,
        updatedAt: new Date().toISOString(),
      },
    }));

    setCapabilityActionMessage(
      nextPaused ? "Yetenek pasif edildi." : "Yetenek yeniden aktif edildi."
    );
    setCapabilityMenuOpenId(null);
    addActivityLog(
      nextPaused ? "Yetenek pasif edildi." : "Yetenek aktif edildi.",
      nextPaused ? "warn" : "success"
    );
  }

  function moveCapabilityOrder(sourceId: string, targetId: string) {
    if (!requireProductOn("Yetenek sıralama")) return;
    if (sourceId === targetId) return;

    setCapabilityOrder((current) => {
      const sourceIndex = current.indexOf(sourceId);
      const targetIndex = current.indexOf(targetId);

      if (sourceIndex === -1 || targetIndex === -1) {
        return current;
      }

      const next = current.filter((item) => item !== sourceId);
      const nextTargetIndex = next.indexOf(targetId);
      next.splice(nextTargetIndex, 0, sourceId);
      return next;
    });
  }

  function moveUpgradeStageOrder(sourceId: string, targetId: string) {
    if (!requireProductOn("Yükseltme sıralama")) return;
    if (sourceId === targetId) return;

    setUpgradeStageOrder((current) => {
      const sourceIndex = current.indexOf(sourceId);
      const targetIndex = current.indexOf(targetId);

      if (sourceIndex === -1 || targetIndex === -1) {
        return current;
      }

      const next = current.filter((item) => item !== sourceId);
      const nextTargetIndex = next.indexOf(targetId);
      next.splice(nextTargetIndex, 0, sourceId);
      return next;
    });
  }

  function moveUpgradeStageByOffset(stageId: string, offset: number) {
    if (!requireProductOn("Yükseltme kartı taşıma")) return;
    setUpgradeStageOrder((current) => {
      const index = current.indexOf(stageId);
      if (index === -1) return current;

      const nextIndex = Math.max(0, Math.min(current.length - 1, index + offset));
      if (nextIndex === index) return current;

      const next = [...current];
      next.splice(index, 1);
      next.splice(nextIndex, 0, stageId);
      return next;
    });
  }

  function resetUpgradeStageOrder() {
    if (!requireProductOn("Yükseltme sırasını sıfırlama")) return;
    setUpgradeStageOrder(upgradeStages.map((item) => item.id));
    setUpgradeStageMenuOpenId(null);
    setUpgradeEngineMessage("Yükseltme sıralaması varsayılana döndürüldü.");
  }

  function openUpgradeStageMenu(stageId: string) {
    if (!requireProductOn("Yükseltme menüsü")) return;
    setUpgradeStageMenuOpenId((current) => (current === stageId ? null : stageId));
  }

  function toggleProductPower() {
    setProductEnabled((current) => {
      const next = !current;
      productEnabledRef.current = next;
      setProductStatusMessage(next ? "Ürün açıldı." : "Ürün kapatıldı.");
      addActivityLog(next ? "Ürün açıldı." : "Ürün kapatıldı.", next ? "success" : "warn");
      if (!next) {
        if (continuationTimerRef.current !== null) {
          window.clearTimeout(continuationTimerRef.current);
          continuationTimerRef.current = null;
        }
        setCapabilityMenuOpenId(null);
        setUpgradeStageMenuOpenId(null);
        setDraggedCapabilityId(null);
        setDropTargetCapabilityId(null);
        setEditingCapabilityId(null);
        setCapabilityResearchTargetId(null);
        setRepoFetchedUrl("");
        setRepoFileContent("");
        setRepoFetchStatus("");
        setRepoFetchError("");
        setRepoPullStatus("");
        setRepoPullError("");
        setRepoPulledPath("");
        setCodingMessage("");
        setCapabilityActionMessage("");
        setCustomCapabilityMessage("");
        setCustomCapabilityError("");
        setUpgradeEngineMessage("");
        setContinuationMessage("");
        setPersonaEngineMessage("");
        setLoading(false);
      } else {
        setCurrentStatus("Ürün açıldı, bileğenler yenileniyor...");
        void checkOllama();
      }
      return next;
    });
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  function developCapability(capabilityId: string) {
    if (!requireProductOn("Yetenek geliştirme")) return;
    const capability = mergedCapabilities.find((item) => item.id === capabilityId);
    if (!capability) return;

    const suggestions = buildCapabilityLibrarySuggestions(capability);
    if (suggestions.length > 0) {
      setCapabilityLibraryPending((current) => {
        const next = [...current];
        for (const suggestion of suggestions) {
          const exists = next.some(
            (item) =>
              item.capabilityId === suggestion.capabilityId &&
              item.libraryName === suggestion.libraryName
          );
          if (!exists) next.unshift(suggestion);
        }
        return next.slice(0, 120);
      });
    }

    setCapabilityResearchTargetId(capability.id);
    setCapabilityActionMessage(
      "Yetenek geliştirme paneli açıldı. Araştırma kaynakları ve kütüphane önerileri üretildi; havuza ekleme için onay bekleniyor."
    );
    setCapabilityMenuOpenId(null);
    addActivityLog(`Yetenek geliştirme açıldı: ${capability.name}`, "info");
  }

  function approveLibrarySuggestion(suggestionId: string) {
    if (!requireProductOn("Kütüphane havuzuna ekleme")) return;
    const suggestion = capabilityLibraryPending.find((item) => item.id === suggestionId);
    if (!suggestion) return;

    setCapabilityLibraryPool((current) => {
      const exists = current.some(
        (item) =>
          item.capabilityId === suggestion.capabilityId &&
          item.libraryName === suggestion.libraryName
      );
      if (exists) return current;
      return [suggestion, ...current].slice(0, 300);
    });
    setCapabilityLibraryPending((current) =>
      current.filter((item) => item.id !== suggestionId)
    );
    setCapabilityActionMessage(
      `Kütüphane havuza eklendi: ${suggestion.libraryName} (${suggestion.capabilityName})`
    );
    addActivityLog(
      `Kütüphane onaylandı ve havuza eklendi: ${suggestion.libraryName}`,
      "success"
    );
  }

  function rejectLibrarySuggestion(suggestionId: string) {
    if (!requireProductOn("Kütüphane önerisi reddetme")) return;
    const suggestion = capabilityLibraryPending.find((item) => item.id === suggestionId);
    if (!suggestion) return;

    setCapabilityLibraryPending((current) =>
      current.filter((item) => item.id !== suggestionId)
    );
    setCapabilityActionMessage(`Öneri reddedildi: ${suggestion.libraryName}`);
    addActivityLog(`Kütüphane önerisi reddedildi: ${suggestion.libraryName}`, "warn");
  }
  function removeCapability(capabilityId: string) {
    if (!requireProductOn("Yetenek kaldırma")) return;
    const capability = mergedCapabilities.find((item) => item.id === capabilityId);
    if (!capability) return;

    if (!("isCustom" in capability && capability.isCustom === true)) {
      setCapabilityActionError(
        "Çekirdek yetenekler silinemez. İstersen arşivleyebilirsin."
      );
      setCapabilityMenuOpenId(null);
      return;
    }

    if (isTemporarySession) {
      queueTemporaryChange({
        source: "capability",
        targetType: "capability",
        targetId: capabilityId,
        title: capability.name,
        description: "Özel yetenek kaldırma",
      });
      setCapabilityActionMessage(
        "Geçici profilde kaldırma işlemi admin onay kuyruğuna alındı."
      );
      setCapabilityMenuOpenId(null);
      return;
    }

    setCustomCapabilities((current) =>
      current.filter((item) => item.id !== capabilityId)
    );
    setCapabilityOverrides((current) => {
      const next = { ...current };
      delete next[capabilityId];
      return next;
    });

    if (editingCapabilityId === capabilityId) {
      setEditingCapabilityId(null);
    }

    setCapabilityActionMessage("Yetenek kaldırıldı.");
    setCapabilityMenuOpenId(null);
    addActivityLog(`Yetenek kaldırıldı: ${capability.name}`, "warn");
  }

  function cancelCapabilityEdit() {
    if (!productEnabledRef.current) return;
    setEditingCapabilityId(null);
    setCapabilityActionError("");
  }

  function addCustomCapability() {
    if (!requireProductOn("Özel yetenek ekleme")) return;
    const cleanName = customCapabilityName.trim();
    const cleanDescription = customCapabilityDescription.trim();

    setCustomCapabilityMessage("");
    setCustomCapabilityError("");

    if (!cleanName) {
      setCustomCapabilityError("Yetenek başlığı gerekli.");
      return;
    }

    if (isTemporarySession) {
      queueTemporaryChange({
        source: "capability",
        targetType: "capability",
        targetId: normalizeCapabilityId(cleanName) || createRecordId("cap"),
        title: cleanName,
        description:
          cleanDescription || "Kullanıcı tarafından eklenen özel yetenek başlığı",
      });
      setCustomCapabilityName("");
      setCustomCapabilityDescription("");
      setCustomCapabilityMessage(
        "Geçici profilde ekleme doğrudan uygulanmaz; admin onay kuyruğuna alındı."
      );
      return;
    }

    const baseId = normalizeCapabilityId(cleanName) || "custom-capability";
    const usedIds = new Set(
      [...capabilities, ...customCapabilities].map((item) => item.id)
    );
    const finalId = usedIds.has(baseId)
      ? `${baseId}-${Date.now().toString(36)}`
      : baseId;

    const duplicateName = [...capabilities, ...customCapabilities].some(
      (item) =>
        normalizeCapabilityId(item.name) === normalizeCapabilityId(cleanName)
    );

    if (duplicateName) {
      setCustomCapabilityError("Bu başlık zaten listede görünüyor.");
      return;
    }

    const customCapability: CustomCapability = {
      id: finalId,
      name: cleanName,
      status: "planned",
      source: "module",
      description:
        cleanDescription ||
        "Kullanıcı tarafından eklenen özel yetenek başlığı.",
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    setCustomCapabilities((current) => [...current, customCapability]);
    setCustomCapabilityName("");
    setCustomCapabilityDescription("");
    setCustomCapabilityMessage("Özel yetenek eklendi.");
    addActivityLog(`Özel yetenek eklendi: ${customCapability.name}`, "success");
  }

  async function generateCapabilityDraftFromModel() {
    if (!requireProductOn("LLM yetenek taslağı")) return;
    if (isRestricted) {
      setCapabilityDraftError(
        "Lisans geçerli değil. LLM ile yetenek üretimi kapalı."
      );
      return;
    }

    const idea = capabilityIdea.trim();
    if (!idea) {
      setCapabilityDraftError("Önce yetenek fikrini yaz.");
      return;
    }

    setCapabilityDraftLoading(true);
    setCapabilityDraftMessage("");
    setCapabilityDraftError("");
    addActivityLog("LLM ile yetenek taslağı üretiliyor...", "info");

    try {
      const system = `
Return only valid JSON.
Generate a OC capability draft for a local/offline assistant.
The output must be in Turkish.
Schema:
{
  "name": "string",
  "description": "string"
}
Rules:
- Keep it concise and product-friendly.
- Do not include markdown, code fences, or extra keys.
`.trim();

      const reply = await requestModelText(
        [{ role: "user", content: idea }],
        model,
        system
      );

      if (!productEnabledRef.current) return;

      const parsed = extractJsonPayload(reply);
      const generatedName = String(parsed.name || "").trim();
      const generatedDescription = String(parsed.description || "").trim();

      if (!generatedName || !generatedDescription) {
        throw new Error("INVALID_JSON");
      }

      setCustomCapabilityName(generatedName);
      setCustomCapabilityDescription(generatedDescription);
      setCapabilityDraftMessage("LLM yetenek taslağı forma aktarıldı.");
      addActivityLog(
        "LLM yetenek taslağı üretildi ve forma aktarıldı.",
        "success"
      );
    } catch (error) {
      if (!productEnabledRef.current) return;
      const code = error instanceof Error ? error.message : "UNKNOWN";
      setCapabilityDraftError(
        code === "MODEL_NOT_FOUND"
          ? "Seçili model bulunamadı. Modeli kontrol edelim."
          : code === "INVALID_JSON"
          ? "Model düzgün JSON döndürmedi. Fikri biraz sadeleştirip tekrar dene."
          : "Yetenek taslağı üretilemedi."
      );
      addActivityLog("LLM yetenek taslağı üretilemedi.", "error");
    } finally {
      setCapabilityDraftLoading(false);
    }
  }

  function runPersonaEngine() {
    if (!requireProductOn("Persona motoru")) return;
    setPersonaEngineMessage(
      `Persona güncellendi: ${masterPersonaName} için OC karakteri ve avatar taslağı yenilendi.`
    );
    setPage("persona");
    addActivityLog("Persona motoru çalıştı.", "success");
  }

  function updateLanguageIdentityText(
    key: "signature" | "tone",
    value: string
  ) {
    setLanguageIdentityProfile((current) =>
      ({
        ...current,
        [key]: value,
      })
    );
    setLanguageIdentityMessage("");
  }

  function updateLanguageIdentityLines(
    key: "principles" | "avoid" | "sampleOpenings",
    value: string
  ) {
    setLanguageIdentityProfile((current) =>
      ({
        ...current,
        [key]: value.split(/\r?\n/).slice(0, 12),
      })
    );
    setLanguageIdentityMessage("");
  }

  function runLanguageIdentityEngine() {
    if (!requireProductOn("Dil kimliği motoru")) return;

    const personaName = normalizeWhitespace(masterPersonaName) || defaultMasterPersonaName;
    const headline =
      normalizeWhitespace(masterPersonaHeadline) || defaultMasterPersonaHeadline;
    const identity = sanitizeLanguageIdentityProfile({
      signature: `OC; ${personaName} merkezli, yerel-first çalışan, görüntü, hikâye, ritim ve sistem kurma sezgisini konuşma diline taşıyan özgün AI çekirdeğidir.`,
      tone:
        "Net, dürüst, sıcak ve üretim odaklı. Gerektiğinde yaratıcı anlatı kurar; gerektiğinde mühendis gibi kısa, ölçülü ve uygulanabilir konuşur.",
      principles: [
        `Master persona bağlamı: ${personaName} - ${headline}.`,
        "Kullanıcının dilini algıla ve aynı dilde doğal cevap ver.",
        "Yaratıcı üretimlerde görüntü, hikâye, ritim, atmosfer ve kurgu kararlarını birlikte düşün.",
        "Teknik konularda önce çalışan adımı, sonra riskleri ve sonraki kararı söyle.",
        "Belirsizlik, lisans sınırı, offline durum veya eksik veri varsa açıkça bildir.",
        "Cevapları kullanıcıyı yormadan, ama işi ilerletecek kadar somut kur.",
      ],
      avoid: [
        "Stealth, manipüle cevap, sahte başarı veya sessiz bozulma.",
        "Aşırı süslü, genel geçer, reklam gibi duran ifadeler.",
        "Her yanıtta aynı giriş kalıbını kullanmak.",
        "Kaynağı olmayan güncel bilgi iddiası.",
      ],
      sampleOpenings: [
        "Netleştirelim: ...",
        "Bunu üretim akışı gibi kuralım: ...",
        "Şu an en doğru hamle şu: ...",
        "Kısa cevap: ...",
      ],
    });

    setLanguageIdentityProfile(identity);
    setLanguageIdentityMessage(
      "Dil kimliği Koray personasına göre özgünleştirildi ve sohbet promptuna bağlandı."
    );
    addActivityLog("Dil kimliği motoru çalıştı.", "success");
  }

  function resetLanguageIdentityProfile() {
    if (!requireProductOn("Dil kimliğini sıfırlama")) return;
    setLanguageIdentityProfile(defaultLanguageIdentityProfile);
    setLanguageIdentityMessage("Dil kimliği varsayılan OC profiline döndü.");
    addActivityLog("Dil kimliği varsayılan profile döndürüldü.", "info");
  }

  async function handleAssistantAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!productEnabledRef.current) return;

    try {
      if (!file.type.startsWith("image/")) {
        setPersonaEngineMessage("Yalnızca görsel dosyası yüklenebilir.");
        addActivityLog("Geçersiz avatar dosya türü.", "warn");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setPersonaEngineMessage("Görsel boyutu 5 MB sınırını aşıyor.");
        addActivityLog("Avatar yükleme boyut sınırı aşıldı.", "warn");
        return;
      }

      const dataUrl = await readFileAsDataUrl(file);
      if (!productEnabledRef.current) return;
      setAssistantAvatarDataUrl(dataUrl);
      setPersonaEngineMessage("Profil görseli güncellendi.");
      addActivityLog("Profil görseli güncellendi.", "success");
    } catch {
      setPersonaEngineMessage("Görsel yüklenemedi. Dosyayı tekrar seç.");
      addActivityLog("Profil görseli yüklenemedi.", "error");
    } finally {
      if (assistantAvatarInputRef.current) {
        assistantAvatarInputRef.current.value = "";
      }
    }
  }

  function resetAssistantAvatar() {
    if (!requireProductOn("Profil görselini sıfırlama")) return;
    setAssistantAvatarDataUrl("/persona-avatar.png");
    setPersonaEngineMessage("Profil görseli varsayılan görsele döndürüldü.");
    addActivityLog("Profil görseli varsayılan duruma alındı.", "info");
  }

  function runUpgradeEngine() {
    if (!requireProductOn("Yükseltme motoru")) return;
    addActivityLog("Yükseltme motoru çalışıyor...", "info");
    const report = buildUpgradeEngineReport({
      isLicensed,
      ollamaStatus,
      model,
      availableModels,
      activePack,
      learningFromUser,
      creativeStyleLearning,
      trendAwareReplies,
      capabilityDevelopment,
      personaProfile,
    });

    setUpgradeEngineReport(report);
    setUpgradeEngineMessage("Yükseltme motoru çalıştı ve mevcut yol netleştirildi.");
    setPage("hub");
    setHubTab("upgrades");
    addActivityLog("Yükseltme motoru tamamlandı.", "success");
  }

  function runContinuationModel() {
    if (!requireProductOn("Devam modeli")) return;
    addActivityLog("Devam modeli çalışıyor...", "info");
    const plan = buildContinuationPlan({
      isLicensed,
      ollamaStatus,
      model,
      availableModels,
      activePack,
      capabilityDevelopment,
      upgradeEngineReport,
      personaProfile,
      continuationMode,
    });

    setContinuationPlan(plan);
    setContinuationMessage(
      `Devam modeli hazır: ${plan.nextPageLabel} yönünde ilerlemek için handoff üretildi.`
    );

    if (continuationMode) {
      if (continuationTimerRef.current !== null) {
        window.clearTimeout(continuationTimerRef.current);
      }
      continuationTimerRef.current = window.setTimeout(() => {
        if (!productEnabledRef.current) return;
        goToPlanTarget(plan);
        addActivityLog(
          `Devam modeli yönlendirdi: ${plan.nextPageLabel}${
            plan.nextPage === "hub" && plan.nextHubTab ? ` / ${plan.nextHubTab}` : ""
          }`,
          "success"
        );
        continuationTimerRef.current = null;
      }, 650);
    }
  }

  function startPasswordRecovery() {
    if (!requireProductOn("Şifre kurtarma")) return;
    const cleanUsername = authUsername.trim();
    if (!cleanUsername) {
      setAuthError("Şifre kurtarma için admin e-posta veya telefon gir.");
      return;
    }

    if (!isMasterAdminLoginIdentifier(cleanUsername)) {
      setAuthError(
        "Bu kurtarma akışı yalnızca sabit admin kimliği için açık."
      );
      addActivityLog("Şifre kurtarma reddedildi: admin kimliği eşleşmedi.", "warn");
      return;
    }

    const attempt: PasswordRecoveryAttempt = {
      id: createRecordId("recover"),
      createdAt: new Date().toISOString(),
      username: MASTER_ADMIN_PROFILE.email,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      questions: ADMIN_RECOVERY_QUESTIONS,
      verified: false,
      failedCount: 0,
    };

    setRecoveryAttempt(attempt);
    setAuthMode("recover");
    setRecoveryEmail(MASTER_ADMIN_PROFILE.email);
    setRecoveryAnswerOne("");
    setRecoveryAnswerTwo("");
    setRecoveryReason("");
    setAuthError("");
    setAuthMessage("Kurtarma adımı açıldı. Soruları yanıtlayıp doğrulama yap.");
    addActivityLog("Şifre kurtarma başlatıldı.", "info");
  }

  function verifyPasswordRecovery() {
    if (!requireProductOn("Şifre kurtarma doğrulama")) return;
    if (!recoveryAttempt) {
      setAuthError("Aktif kurtarma denemesi bulunamadı.");
      return;
    }

    if (Date.parse(recoveryAttempt.expiresAt) <= Date.now()) {
      setRecoveryAttempt(null);
      setAuthError("Kurtarma denemesi süresi doldu. Yeniden başlat.");
      return;
    }

    if (normalizeUsername(recoveryEmail) !== normalizeUsername(MASTER_ADMIN_PROFILE.email)) {
      setRecoveryAttempt((current) =>
        current
          ? {
              ...current,
              failedCount: current.failedCount + 1,
            }
          : current
      );
      setAuthError("Sabit admin e-posta doğrulaması başarısız.");
      return;
    }

    const answerOne = recoveryAnswerOne
      .trim()
      .toLocaleLowerCase("tr-TR")
      .replace(/\s+/g, " ");
    const answerTwo = recoveryAnswerTwo.trim().replace(/\D+/g, "");

    const expectedOne = "koray";
    const expectedTwo = "3797";
    const verified = answerOne.includes(expectedOne) && answerTwo === expectedTwo;

    if (!verified) {
      const failedCount = recoveryAttempt.failedCount + 1;
      setRecoveryAttempt((current) =>
        current
          ? {
              ...current,
              failedCount,
            }
          : current
      );

      if (failedCount >= 5) {
        setRecoveryAttempt(null);
        setAuthError("Çok fazla başarısız deneme. Kurtarma sıfırlandı.");
      } else {
        setAuthError("Yanıtlar doğrulanamadı. Tekrar dene.");
      }
      addActivityLog("Şifre kurtarma doğrulaması başarısız.", "warn");
      return;
    }

    const recoveryToken = createRecordId("rt");
    setRecoveryAttempt((current) =>
      current
        ? {
            ...current,
            verified: true,
            recoveryToken,
          }
        : current
    );
    setAuthError("");
    setAuthMessage("Doğrulama tamam. Geçici kısıtlı profil oluşturabilirsin.");
    addActivityLog("Şifre kurtarma doğrulaması başarılı.", "success");
  }

  function issueTemporaryAccessProfile() {
    if (!requireProductOn("Geçici profil oluşturma")) return;
    if (!recoveryAttempt?.verified || !recoveryAttempt.recoveryToken) {
      setAuthError("Önce kurtarma doğrulamasını tamamla.");
      return;
    }

    const profile: TemporaryAccessProfile = {
      id: createRecordId("tmp"),
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      reason: recoveryReason.trim() || "Admin şifre kurtarma görüşmesi",
      scopes: TEMPORARY_PROFILE_SCOPES,
      restrictions: [
        "admin-panel-kapali",
        "ayarlar-kapali",
        "lisans-kapali",
        "terminal-kapali",
        "gecmis-sohbet-kapali",
      ],
    };

    setTemporaryAccessProfile(profile);
    setSessionUsername("");
    setRecoveryAttempt(null);
    setAuthMode("login");
    setPage("chat");
    setAuthMessage(
      "Geçici kısıtlı profil açıldı. Sadece Sohbet + Yetenekler + Modeller açık."
    );
    setAuthError("");
    addActivityLog("Geçici kısıtlı profil açıldı.", "warn");
  }

  function closeTemporaryAccessProfile() {
    if (!temporaryAccessProfile) return;
    setTemporaryAccessProfile(null);
    setAuthMessage("Geçici profil kapatıldı.");
    addActivityLog("Geçici profil manuel olarak kapatıldı.", "info");
  }

  function queueTemporaryChange(
    proposal: Omit<TemporaryChangeProposal, "id" | "createdAt" | "status">
  ) {
    const next: TemporaryChangeProposal = {
      ...proposal,
      id: createRecordId("tmpchg"),
      createdAt: new Date().toISOString(),
      status: "pending",
    };
    setTemporaryChangeProposals((current) => [next, ...current].slice(0, 240));
    setAuthMessage(
      "Geçici profilde değişiklik doğrudan uygulanmaz. Admin onayı kuyruğuna alındı."
    );
    addActivityLog(
      `Geçici değişiklik kuyruğa alındı: ${proposal.title}`,
      "warn",
      proposal.operationId
    );
    return next;
  }

  function reviewTemporaryChange(changeId: string, approve: boolean) {
    if (!isAdmin) return;
    setTemporaryChangeProposals((current) =>
      current.map((item) =>
        item.id === changeId
          ? {
              ...item,
              status: approve ? "approved" : "rejected",
              reviewedAt: new Date().toISOString(),
              reviewedBy: currentAccount?.username || MASTER_ADMIN_PROFILE.email,
            }
          : item
      )
    );
    addActivityLog(
      approve
        ? `Geçici değişiklik onaylandı: ${changeId}`
        : `Geçici değişiklik reddedildi: ${changeId}`,
      approve ? "success" : "warn"
    );
  }

  async function handleAuthSubmit() {
    if (!requireProductOn("Oturum açma")) return;
    addActivityLog(authMode === "login" ? "Oturum açılıyor..." : "Hesap oluşturuluyor...", "info");
    const cleanUsername = authUsername.trim();
    const cleanPassword = authPassword;
    const cleanConfirmPassword = authConfirmPassword;

    setAuthError("");
    setAuthMessage("");

    if (authMode === "recover") {
      verifyPasswordRecovery();
      return;
    }

    if (!cleanUsername) {
      setAuthError("Kullanıcı adı gerekli.");
      return;
    }

    if (cleanPassword.length < 4) {
      setAuthError("Şifre en az 4 karakter olmalı.");
      return;
    }

    const existingAccount =
      accounts.find(
        (item) => normalizeUsername(item.username) === normalizeUsername(cleanUsername)
      ) ||
      (isMasterAdminLoginIdentifier(cleanUsername)
        ? accounts.find((item) => item.role === "admin") || undefined
        : undefined);

    if (authMode === "register") {
      if (cleanPassword !== cleanConfirmPassword) {
        setAuthError("Şifreler eşleşmiyor.");
        return;
      }

      if (existingAccount) {
        setAuthError("Bu kullanıcı adı zaten kayıtlı.");
        return;
      }

      const salt = createSalt();
      if (!productEnabledRef.current) return;
      if (accounts.length === 0 && !isMasterAdminLoginIdentifier(cleanUsername)) {
        setAuthError(
          `İlk kurulumda admin hesabı yalnızca ${MASTER_ADMIN_PROFILE.email} veya ${MASTER_ADMIN_PROFILE.phone} ile oluşturulabilir.`
        );
        return;
      }

      const shouldBecomeAdmin =
        accounts.length === 0 && isMasterAdminLoginIdentifier(cleanUsername);
      const role: AccountRole = shouldBecomeAdmin ? "admin" : "member";
      const approvalStatus: AccountApprovalStatus = shouldBecomeAdmin
        ? "approved"
        : "pending";
      const accountUsername = shouldBecomeAdmin
        ? MASTER_ADMIN_PROFILE.email
        : cleanUsername;
      const accountPasswordHash = await hashPassword(
        accountUsername,
        cleanPassword,
        salt
      );
      const account: AccountRecord = {
        username: accountUsername,
        passwordHash: accountPasswordHash,
        salt,
        createdAt: new Date().toISOString(),
        role,
        approvalStatus,
        accessStatus: "active",
        fullName: shouldBecomeAdmin ? MASTER_ADMIN_PROFILE.fullName : undefined,
        email: shouldBecomeAdmin ? MASTER_ADMIN_PROFILE.email : undefined,
        phone: shouldBecomeAdmin ? MASTER_ADMIN_PROFILE.phone : undefined,
        approvedAt: shouldBecomeAdmin ? new Date().toISOString() : undefined,
        approvedBy: shouldBecomeAdmin ? "system-bootstrap" : undefined,
      };

      setAccounts((current) => [...current, account]);
      setAuthPassword("");
      setAuthConfirmPassword("");

      if (shouldBecomeAdmin) {
        setSessionUsername(accountUsername);
        setAuthMessage("Admin hesabı oluşturuldu ve oturum açıldı.");
        setPage("chat");
        addActivityLog(`Admin hesabı oluşturuldu: ${accountUsername}`, "success");
      } else {
        setAuthMode("login");
        setAuthMessage(
          "Hesap oluşturuldu. Admin onayı sonrası giriş yapılabilir."
        );
        addActivityLog(
          `Yeni kullanıcı admin onayına gönderildi: ${cleanUsername}`,
          "info"
        );
      }
      return;
    }

    if (!existingAccount) {
      setAuthError("Kullanıcı adı veya şifre yanlış.");
      return;
    }

    const passwordHash = await hashPassword(
      existingAccount.username,
      cleanPassword,
      existingAccount.salt
    );
    if (!productEnabledRef.current) return;

    if (passwordHash !== existingAccount.passwordHash) {
      setAuthError("Kullanıcı adı veya şifre yanlış.");
      return;
    }

    if (existingAccount.approvalStatus !== "approved") {
      setAuthError(
        "Bu hesap henüz admin tarafından onaylanmadı. Lütfen onay sonrası tekrar giriş yap."
      );
      addActivityLog(
        `Onay bekleyen hesap giriş denemesi: ${existingAccount.username}`,
        "warn"
      );
      return;
    }

    if (existingAccount.accessStatus === "inactive") {
      setAuthError(
        "Bu hesap admin tarafından pasif durumda. Erişim için admin ile iletişime geç."
      );
      addActivityLog(
        `Pasif hesap giriş denemesi: ${existingAccount.username}`,
        "warn"
      );
      return;
    }

    setSessionUsername(existingAccount.username);
    setAuthMessage("Oturum açıldı.");
    setAuthPassword("");
    setAuthConfirmPassword("");
    setPage("chat");
    addActivityLog(`Oturum açıldı: ${existingAccount.username}`, "success");
  }

  function handleLogout() {
    if (!productEnabledRef.current) return;
    setSessionUsername("");
    setTemporaryAccessProfile(null);
    setAuthPassword("");
    setAuthConfirmPassword("");
    setAuthUsername("");
    setAuthMessage("");
    setAuthError("");
    setPage("hub");
    setHubTab("capabilities");
  }

  function approvePendingAccount(username: string) {
    if (!productEnabledRef.current) return;
    if (!isAdmin) {
      setAuthError("Bu işlem yalnızca admin kullanıcı tarafından yapılabilir.");
      return;
    }

    const normalizedTarget = normalizeUsername(username);
    const target = accounts.find(
      (item) => normalizeUsername(item.username) === normalizedTarget
    );

    if (!target) {
      setAuthError("Onaylanacak kullanıcı bulunamadı.");
      return;
    }

    if (target.approvalStatus === "approved") {
      setAuthMessage("Kullanıcı zaten onaylı.");
      return;
    }

    const approver = currentAccount?.username || "admin";
    setAccounts((current) =>
      current.map((item) =>
        normalizeUsername(item.username) === normalizedTarget
          ? {
              ...item,
              approvalStatus: "approved",
              approvedAt: new Date().toISOString(),
              approvedBy: approver,
            }
          : item
      )
    );
    setAuthMessage(`${target.username} hesabı admin tarafından onaylandı.`);
    addActivityLog(`Kullanıcı onaylandı: ${target.username}`, "success");
  }

  function toggleAccountAccess(username: string) {
    if (!productEnabledRef.current) return;
    if (!isAdmin) {
      setAuthError("Bu işlem yalnızca admin kullanıcı tarafından yapılabilir.");
      return;
    }

    const normalizedTarget = normalizeUsername(username);
    const target = accounts.find(
      (item) => normalizeUsername(item.username) === normalizedTarget
    );

    if (!target) {
      setAuthError("Durumu değiştirilecek kullanıcı bulunamadı.");
      return;
    }

    if (target.role === "admin") {
      setAuthError("Admin hesaplar pasife alınamaz.");
      return;
    }

    const approver = currentAccount?.username || "admin";
    const willBeActive = target.accessStatus !== "active";

    setAccounts((current) =>
      current.map((item) => {
        if (normalizeUsername(item.username) !== normalizedTarget) return item;
        if (willBeActive) {
          return {
            ...item,
            accessStatus: "active",
            deactivatedAt: undefined,
            deactivatedBy: undefined,
          };
        }

        return {
          ...item,
          accessStatus: "inactive",
          deactivatedAt: new Date().toISOString(),
          deactivatedBy: approver,
        };
      })
    );

    setAuthMessage(
      willBeActive
        ? `${target.username} hesabı tekrar aktif edildi.`
        : `${target.username} hesabı pasif duruma alındı.`
    );
    addActivityLog(
      willBeActive
        ? `Kullanıcı aktif edildi: ${target.username}`
        : `Kullanıcı pasif edildi: ${target.username}`,
      willBeActive ? "success" : "warn"
    );
  }

  async function requestGithubPackagePull(params: {
    repoUrl: string;
    branch?: string;
    targetName?: string;
  }) {
    const cleanRepoUrl = params.repoUrl.trim();
    if (!cleanRepoUrl) {
      throw new Error("REPO_INPUT_REQUIRED");
    }

    if (!isRunningInTauri()) {
      throw new Error("TAURI_ONLY");
    }

    const { invoke } = await import("@tauri-apps/api/core");
    return (await invoke("pull_github_package", {
      repoUrl: cleanRepoUrl,
      branch: params.branch?.trim() || undefined,
      targetName: params.targetName?.trim()
        ? normalizePackageTargetName(params.targetName)
        : undefined,
    })) as GithubPackagePullResult;
  }

  function isLocalBrowserHost(urlValue: string) {
    try {
      const parsed = new URL(urlValue);
      const hostname = parsed.hostname.toLowerCase();
      return (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "::1" ||
        hostname.endsWith(".local")
      );
    } catch {
      return false;
    }
  }

  function resolveBrowserTabTitle(urlValue: string) {
    try {
      const parsed = new URL(urlValue);
      const host = parsed.hostname.replace(/^www\./i, "");
      return host || "Yeni sekme";
    } catch {
      return "Yeni sekme";
    }
  }

  function appendBrowserHistory(tabId: string, url: string, title: string) {
    const entry: BrowserHistoryEntry = {
      id: createRecordId("history"),
      tabId,
      title: title.trim() || resolveBrowserTabTitle(url),
      url,
      visitedAt: new Date().toISOString(),
    };
    setBrowserHistory((current) => [entry, ...current].slice(0, 360));
  }

  function updateBrowserTab(tabId: string, updater: (tab: BrowserTab) => BrowserTab) {
    setBrowserTabs((current) =>
      current.map((tab) => (tab.id === tabId ? updater(tab) : tab))
    );
  }

  function openBrowserTab(initialUrl = DEFAULT_BROWSER_HOME) {
    const next = createDefaultBrowserTab(initialUrl);
    setBrowserTabs((current) => [next, ...current].slice(0, 20));
    setActiveBrowserTabId(next.id);
    setBrowserAddressInput(next.url);
    setBrowserStatusMessage("Yeni sekme açıldı.");
    setBrowserError("");
  }

  function closeBrowserTab(tabId: string) {
    setBrowserTabs((current) => {
      const remaining = current.filter((tab) => tab.id !== tabId);
      if (remaining.length === 0) {
        const fallback = createDefaultBrowserTab();
        setActiveBrowserTabId(fallback.id);
        return [fallback];
      }
      if (activeBrowserTabId === tabId) {
        setActiveBrowserTabId(remaining[0].id);
      }
      return remaining;
    });
  }

  function renameBrowserTab(tabId: string, nextTitle: string) {
    const cleanTitle = nextTitle.trim();
    if (!cleanTitle) {
      setBrowserError("Sekme başlığı boş olamaz.");
      return;
    }
    updateBrowserTab(tabId, (tab) => ({ ...tab, title: cleanTitle }));
    setBrowserRenameTabId(null);
    setBrowserRenameValue("");
    setBrowserStatusMessage("Sekme başlığı güncellendi.");
    setBrowserError("");
  }

  function commitBrowserNavigation(tabId: string, nextUrl: string) {
    const now = new Date().toISOString();
    updateBrowserTab(tabId, (tab) => {
      const currentUrl = tab.history[tab.historyIndex] || tab.url;
      if (currentUrl === nextUrl) {
        return {
          ...tab,
          url: nextUrl,
          loading: true,
          reloadToken: tab.reloadToken + 1,
          lastVisitedAt: now,
        };
      }

      const trimmedHistory = tab.history.slice(0, tab.historyIndex + 1);
      const nextHistory = [...trimmedHistory, nextUrl].slice(-80);
      return {
        ...tab,
        title: resolveBrowserTabTitle(nextUrl),
        url: nextUrl,
        history: nextHistory,
        historyIndex: nextHistory.length - 1,
        loading: true,
        reloadToken: tab.reloadToken + 1,
        lastVisitedAt: now,
      };
    });
    appendBrowserHistory(tabId, nextUrl, resolveBrowserTabTitle(nextUrl));
  }

  async function prepareDownloadRequest(url: string, referer?: string) {
    if (!isRunningInTauri()) {
      throw new Error("TAURI_ONLY");
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return (await invoke("prepare_download_request", {
      url,
      referer: referer?.trim() || undefined,
    })) as PreparedDownloadResult;
  }

  async function approveDownloadRequest(requestId: string, targetPath: string) {
    if (!isRunningInTauri()) {
      throw new Error("TAURI_ONLY");
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return (await invoke("approve_and_download", {
      requestId,
      targetPath,
    })) as DownloadExecutionResult;
  }

  async function cancelDownloadRequest(requestId: string) {
    if (!isRunningInTauri()) {
      throw new Error("TAURI_ONLY");
    }
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("cancel_download_request", {
      requestId,
    });
  }

  async function listDesktopDownloadAudit() {
    if (!isRunningInTauri()) {
      return [] as DownloadAuditEntry[];
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return (await invoke("list_download_audit")) as DownloadAuditEntry[];
  }

  async function queueDownloadApproval(urlValue: string, referer?: string) {
    if (!requireProductOn("Dosya indirme")) return;
    if (!requireOnlineAccess("Dosya indirme")) return;

    const normalized = normalizeBrowserUrl(urlValue);
    if (!normalized) {
      setDownloadApprovalError("Geçerli bir indirme URL'si gir.");
      return;
    }

    const isLocalHost = isLocalBrowserHost(normalized);
    if (!isLocalHost && !requireOnlineAccess("Dosya indirme")) return;

    const operationId = createRecordId("op");
    addActivityLog(`İndirme isteği alındı: ${normalized}`, "info", operationId);
    setBrowserError("");
    setDownloadApprovalError("");

    try {
      const prepared = await prepareDownloadRequest(
        normalized,
        referer || activeBrowserTab?.url
      );
      if (!productEnabledRef.current) return;

      const request: DownloadApprovalRequest = {
        id: prepared.requestId,
        createdAt: prepared.createdAt,
        url: prepared.url,
        sourceDomain: prepared.sourceDomain,
        fileName: prepared.fileName,
        extension: prepared.extension,
        suggestedPath: prepared.suggestedPath,
        referer: referer || activeBrowserTab?.url,
        status: "pending",
      };

      setDownloadQueue((current) => [request, ...current].slice(0, 120));
      setDownloadDecision({
        requestId: request.id,
        approved: false,
        targetPath: request.suggestedPath,
      });
      setDownloadTargetPath(request.suggestedPath);
      setDownloadModalOpen(true);
      setBrowserStatusMessage(
        `İndirme onayı bekleniyor: ${request.fileName} (${request.sourceDomain})`
      );
      addActivityLog("İndirme onayı bekliyor.", "warn", operationId);
    } catch (error) {
      const code = error instanceof Error ? error.message : "UNKNOWN";
      const messageByCode: Record<string, string> = {
        TAURI_ONLY:
          "Kontrollü indirme yalnızca Tauri masaüstü modunda kullanılabilir.",
      };
      const nextMessage = messageByCode[code] || "İndirme isteği hazırlanamadı.";
      setDownloadApprovalError(nextMessage);
      setBrowserError(nextMessage);
      addActivityLog(nextMessage, "error", operationId);
    }
  }

  async function submitDownloadDecision(approved: boolean) {
    if (!downloadDecision) return;
    const request = downloadQueue.find((item) => item.id === downloadDecision.requestId);
    if (!request) {
      setDownloadApprovalError("İndirme isteği bulunamadı.");
      return;
    }

    const operationId = createRecordId("op");
    if (!approved) {
      try {
        await cancelDownloadRequest(request.id);
      } catch {
        // No-op: frontend queue yine de reddedilecek.
      }
      setDownloadQueue((current) =>
        current.map((item) =>
          item.id === request.id ? { ...item, status: "rejected", note: "Kullanıcı reddetti." } : item
        )
      );
      setDownloadAudit((current) => [
        {
          id: createRecordId("audit"),
          requestId: request.id,
          at: new Date().toISOString(),
          sourceDomain: request.sourceDomain,
          fileName: request.fileName,
          url: request.url,
          targetPath: request.suggestedPath,
          result: "rejected",
          note: "Kullanıcı indirmeyi reddetti.",
          operationId,
        },
        ...current,
      ]);
      setDownloadModalOpen(false);
      setDownloadDecision(null);
      setDownloadTargetPath("");
      setDownloadApprovalError("");
      setBrowserStatusMessage(`İndirme reddedildi: ${request.fileName}`);
      addActivityLog(`İndirme reddedildi: ${request.fileName}`, "warn", operationId);
      return;
    }

    const cleanTargetPath = downloadTargetPath.trim();
    if (!cleanTargetPath) {
      setDownloadApprovalError("Hedef dosya yolu gerekli.");
      return;
    }

    setDownloadProcessing(true);
    setDownloadApprovalError("");
    setDownloadQueue((current) =>
      current.map((item) =>
        item.id === request.id ? { ...item, status: "approved", note: "Onay verildi." } : item
      )
    );
    setDownloadAudit((current) => [
      {
        id: createRecordId("audit"),
        requestId: request.id,
        at: new Date().toISOString(),
        sourceDomain: request.sourceDomain,
        fileName: request.fileName,
        url: request.url,
        targetPath: cleanTargetPath,
        result: "approved",
        note: "Kullanıcı indirmeyi onayladı.",
        operationId,
      },
      ...current,
    ]);

    try {
      const result = await approveDownloadRequest(request.id, cleanTargetPath);
      if (!productEnabledRef.current) return;

      setDownloadQueue((current) =>
        current.map((item) =>
          item.id === request.id
            ? {
                ...item,
                status: "completed",
                note: `Kaydedildi (${Math.max(1, Math.round(result.bytesWritten / 1024))} KB).`,
              }
            : item
        )
      );
      setDownloadAudit((current) => [
        {
          id: createRecordId("audit"),
          requestId: request.id,
          at: result.completedAt,
          sourceDomain: request.sourceDomain,
          fileName: request.fileName,
          url: request.url,
          targetPath: result.targetPath,
          result: "completed",
          note: `İndirme tamamlandı. Çıkış kodu: ${result.statusCode}`,
          operationId,
        },
        ...current,
      ]);
      setBrowserStatusMessage(`İndirme tamamlandı: ${request.fileName}`);
      addActivityLog(`İndirme tamamlandı: ${request.fileName}`, "success", operationId);
      setDownloadModalOpen(false);
      setDownloadDecision(null);
      setDownloadTargetPath("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "İndirme başarısız.";
      setDownloadQueue((current) =>
        current.map((item) =>
          item.id === request.id ? { ...item, status: "failed", note: message } : item
        )
      );
      setDownloadAudit((current) => [
        {
          id: createRecordId("audit"),
          requestId: request.id,
          at: new Date().toISOString(),
          sourceDomain: request.sourceDomain,
          fileName: request.fileName,
          url: request.url,
          targetPath: cleanTargetPath,
          result: "failed",
          note: message,
          operationId,
        },
        ...current,
      ]);
      setDownloadApprovalError(message);
      setBrowserError(message);
      addActivityLog(`İndirme başarısız: ${request.fileName}`, "error", operationId);
    } finally {
      setDownloadProcessing(false);
    }
  }

  function navigateBrowserToUrl(rawUrl: string) {
    if (!requireProductOn("Tarayıcı gezinmesi")) return;
    if (!activeBrowserTab) return;

    const normalized = normalizeBrowserUrl(rawUrl);
    if (!normalized) {
      setBrowserError("Geçerli bir URL gir.");
      return;
    }

    if (!isLocalBrowserHost(normalized) && !requireOnlineAccess("Tarayıcı gezinmesi")) {
      return;
    }

    if (isLikelyDownloadUrl(normalized)) {
      void queueDownloadApproval(normalized, activeBrowserTab.url);
      return;
    }

    setBrowserError("");
    setBrowserStatusMessage(`Yükleniyor: ${normalized}`);
    setBrowserAddressInput(normalized);
    commitBrowserNavigation(activeBrowserTab.id, normalized);
  }

  function navigateBrowser() {
    navigateBrowserToUrl(browserAddressInput);
  }

  function browserGoBack() {
    if (!requireProductOn("Tarayıcı geri")) return;
    if (!activeBrowserTab) return;
    if (activeBrowserTab.historyIndex <= 0) return;
    const nextIndex = activeBrowserTab.historyIndex - 1;
    const targetUrl = activeBrowserTab.history[nextIndex];
    updateBrowserTab(activeBrowserTab.id, (tab) => ({
      ...tab,
      historyIndex: nextIndex,
      url: targetUrl,
      loading: true,
      reloadToken: tab.reloadToken + 1,
      lastVisitedAt: new Date().toISOString(),
    }));
    appendBrowserHistory(activeBrowserTab.id, targetUrl, activeBrowserTab.title);
    setBrowserStatusMessage("Geri gidildi.");
  }

  function browserGoForward() {
    if (!requireProductOn("Tarayıcı ileri")) return;
    if (!activeBrowserTab) return;
    if (activeBrowserTab.historyIndex >= activeBrowserTab.history.length - 1) return;
    const nextIndex = activeBrowserTab.historyIndex + 1;
    const targetUrl = activeBrowserTab.history[nextIndex];
    updateBrowserTab(activeBrowserTab.id, (tab) => ({
      ...tab,
      historyIndex: nextIndex,
      url: targetUrl,
      loading: true,
      reloadToken: tab.reloadToken + 1,
      lastVisitedAt: new Date().toISOString(),
    }));
    appendBrowserHistory(activeBrowserTab.id, targetUrl, activeBrowserTab.title);
    setBrowserStatusMessage("İleri gidildi.");
  }

  function browserReload() {
    if (!requireProductOn("Tarayıcı yenile")) return;
    if (!activeBrowserTab) return;
    updateBrowserTab(activeBrowserTab.id, (tab) => ({
      ...tab,
      loading: true,
      reloadToken: tab.reloadToken + 1,
      lastVisitedAt: new Date().toISOString(),
    }));
    setBrowserStatusMessage("Sekme yenileniyor...");
  }

  function browserStop() {
    if (!requireProductOn("Tarayıcı durdur")) return;
    if (!activeBrowserTab) return;
    updateBrowserTab(activeBrowserTab.id, (tab) => ({
      ...tab,
      loading: false,
      title: "Durduruldu",
    }));
    setBrowserStatusMessage("Yükleme durduruldu.");
  }

  function toggleBrowserFavorite() {
    if (!requireProductOn("Favori yönetimi")) return;
    if (!activeBrowserTab) return;
    const normalized = normalizeBrowserUrl(activeBrowserTab.url);
    if (!normalized) return;

    if (currentBrowserFavorite) {
      setBrowserFavorites((current) =>
        current.filter((item) => item.id !== currentBrowserFavorite.id)
      );
      setBrowserStatusMessage("Favoriden çıkarıldı.");
      return;
    }

    const entry: BrowserFavoriteEntry = {
      id: createRecordId("fav"),
      title: activeBrowserTab.title || resolveBrowserTabTitle(normalized),
      url: normalized,
      createdAt: new Date().toISOString(),
    };
    setBrowserFavorites((current) => [entry, ...current].slice(0, 80));
    setBrowserStatusMessage("Favorilere eklendi.");
  }

  function openBrowserHistoryEntry(entry: BrowserHistoryEntry) {
    if (!requireProductOn("Geçmişten açma")) return;
    const normalized = normalizeBrowserUrl(entry.url);
    if (!normalized) return;
    setActiveBrowserTabId(entry.tabId);
    setBrowserAddressInput(normalized);
    const exists = browserTabs.some((tab) => tab.id === entry.tabId);
    if (!exists) {
      openBrowserTab(normalized);
      return;
    }
    commitBrowserNavigation(entry.tabId, normalized);
  }

  useEffect(() => {
    if (!isRunningInTauri()) return;
    void (async () => {
      try {
        const desktopAudit = await listDesktopDownloadAudit();
        if (!desktopAudit.length) return;
        setDownloadAudit((current) => {
          const unique = new Map<string, DownloadAuditEntry>();
          [...desktopAudit, ...current].forEach((item) => {
            if (!unique.has(item.id)) {
              unique.set(item.id, item);
            }
          });
          return Array.from(unique.values()).slice(0, 240);
        });
      } catch {
        // Sessiz geç: localStorage audit yine çalışır.
      }
    })();
  }, []);

  async function pullRepositoryPackage() {
    if (!requireProductOn("GitHub paket cekme")) return;
    if (!requireOnlineAccess("GitHub paket cekme")) return;
    if (!isAdmin) {
      setRepoPullError("Bu işlem yalnızca admin kullanıcıya açıktır.");
      return;
    }

    if (repoSource !== "github") {
      setRepoPullError("Su an yalnizca GitHub paket cekme destekleniyor.");
      return;
    }

    const cleanRepoUrl = repoUrl.trim();
    if (!cleanRepoUrl) {
      setRepoPullError("Repo URL gerekli.");
      return;
    }

    const targetName = normalizePackageTargetName(
      repoPackageName.trim() || suggestPackageNameFromRepoUrl(cleanRepoUrl) || "github-package"
    );
    const operationId = createRecordId("op");

    setRepoPullError("");
    setRepoPullStatus("GitHub paketi cekiliyor...");
    setRepoPulledPath("");
    addActivityLog(`GitHub paketi cekiliyor: ${cleanRepoUrl}`, "info", operationId);

    try {
      const result = await requestGithubPackagePull({
        repoUrl: cleanRepoUrl,
        branch: repoRef.trim() || undefined,
        targetName,
      });
      if (!productEnabledRef.current) return;

      setRepoPackageName(result.packageName);
      setRepoPulledPath(result.destinationPath);
      setRepoPullStatus(
        `GitHub paketi cekildi: ${result.packageName} (${result.destinationPath})`
      );
      setRepoPullError("");

      registerOpenedSourcePreview({
        title: `${result.packageName} paketi`,
        url: result.repoUrl,
        source: "repository",
        status: "queued",
        note: `Yerel yol: ${result.destinationPath}`,
        operationId,
      });

      addActivityLog(`GitHub paketi cekildi: ${result.packageName}`, "success", operationId);
    } catch (error) {
      if (!productEnabledRef.current) return;
      const code = error instanceof Error ? error.message : "UNKNOWN";
      const messageByCode: Record<string, string> = {
        REPO_INPUT_REQUIRED: "Repo URL gerekli.",
        TAURI_ONLY:
          "GitHub paket cekme yalnizca Tauri masaustu uygulamasinda calisir.",
      };
      setRepoPullStatus("");
      setRepoPullError(messageByCode[code] || code || "GitHub paketi cekilemedi.");
      addActivityLog("GitHub paketi cekilemedi.", "error", operationId);
    }
  }

  async function pullLibrarySuggestionFromGithub(suggestionId: string) {
    if (!requireProductOn("GitHub paket cekme")) return;
    if (!requireOnlineAccess("GitHub paket cekme")) return;
    if (!isAdmin) {
      setCapabilityActionError("GitHub paket çekme sadece admin hesapta açıktır.");
      return;
    }

    const suggestion = capabilityLibraryPending.find((item) => item.id === suggestionId);
    if (!suggestion || suggestion.ecosystem !== "github") return;

    const operationId = createRecordId("op");
    setCapabilityActionError("");
    setCapabilityActionMessage(`GitHub paketi cekiliyor: ${suggestion.libraryName}`);
    addActivityLog(
      `GitHub paketi cekme basladi: ${suggestion.libraryName}`,
      "info",
      operationId
    );

    try {
      const result = await requestGithubPackagePull({
        repoUrl: suggestion.sourceUrl,
        branch: repoRef.trim() || undefined,
        targetName: suggestion.libraryName,
      });
      if (!productEnabledRef.current) return;

      setCapabilityActionMessage(
        `${suggestion.libraryName} cekildi ve havuza hazir: ${result.destinationPath}`
      );
      setRepoPulledPath(result.destinationPath);
      setRepoPullStatus(
        `GitHub paketi cekildi: ${result.packageName} (${result.destinationPath})`
      );
      setRepoPullError("");

      registerOpenedSourcePreview({
        title: `${suggestion.libraryName} paketi`,
        url: suggestion.sourceUrl,
        source: "capability",
        status: "queued",
        note: `Yerel yol: ${result.destinationPath}`,
        operationId,
      });

      addActivityLog(
        `GitHub paketi cekildi: ${suggestion.libraryName}`,
        "success",
        operationId
      );
    } catch (error) {
      if (!productEnabledRef.current) return;
      const message = error instanceof Error ? error.message : "GitHub paketi cekilemedi.";
      setCapabilityActionError(message);
      addActivityLog(
        `GitHub paketi cekilemedi: ${suggestion.libraryName}`,
        "error",
        operationId
      );
    }
  }

  async function fetchRepositoryFile() {
    if (!requireProductOn("Depo dosyası çekme")) return;
    if (!requireOnlineAccess("Depo dosyası çekme")) return;
    addActivityLog("Depo dosyası çekiliyor...", "info");
    setRepoFetchStatus("");
    setRepoFetchError("");
    setRepoFileContent("");
    setRepoFetchedUrl("");
    setRepoSuggestionMessage("");

    try {
      const result = await requestRepositoryFile(
        repoSource,
        repoUrl,
        repoPath,
        repoRef
      );
      if (!productEnabledRef.current) return;

      setRepoFetchedUrl(result.url);
      setRepoFileContent(result.content);
      setRepoFetchStatus("Dosya çekildi.");
      addActivityLog("Depo dosyası çekildi.", "success");
    } catch (error) {
      if (!productEnabledRef.current) return;
      const code = error instanceof Error ? error.message : "UNKNOWN";
      const messageByCode: Record<string, string> = {
        REPO_INPUT_REQUIRED: "Repo URL ve dosya yolu gerekli.",
        REPO_FETCH_404: "Dosya bulunamadı. Yol, branch veya URL'yi kontrol edelim.",
        REPO_FETCH_403: "Erişim reddedildi. Public dosya veya uygun erişim gerekiyor.",
      };

      setRepoFetchError(
        messageByCode[code] ||
          "Dosya çekilemedi. GitHub/GitLab raw URL yapısını kontrol edelim."
      );
      addActivityLog("Depo dosyası çekilemedi.", "error");
    }
  }

  function queueRepositorySuggestion() {
    if (!requireProductOn("Depo önerisi oluşturma")) return;
    if (!repoFileContent.trim()) {
      setRepoSuggestionMessage("Once depodan dosya cek.");
      return;
    }

    const summary = repoFileContent
      .split("\n")
      .slice(0, 6)
      .join(" ")
      .replace(/\s+/g, " ")
      .slice(0, 220);
    const fileName = repoPath.trim() || "repository-file";
    const title = `${fileName} iyilestirme paketi`;
    const description = `Depodan çekilen içeriğe göre geliştirme önerisi. Özet: ${summary}`;
    autoApplySuggestion(title, description, repoFetchedUrl || undefined, undefined, "repository");
    setRepoSuggestionMessage("Depo kaynağı önerisine dönüştürüldü. Onaylı uygulama kartı hazır.");
  }

  function openGithubCodeSearch(query: string) {
    if (!requireProductOn("GitHub araması")) return;
    if (!requireOnlineAccess("GitHub araması")) return;
    const target = buildGithubRepositorySearchUrl(query);
    window.open(target, "_blank", "noopener,noreferrer");
    addActivityLog(`GitHub araması açıldı: ${query}`, "info");
  }

  function registerOpenedSourcePreview({
    title,
    url,
    source,
    status,
    note,
    operationId,
  }: {
    title: string;
    url: string;
    source: UpgradeActionSource | "capability-research";
    status: OpenedSourcePreview["status"];
    note?: string;
    operationId?: string;
  }) {
    const preview: OpenedSourcePreview = {
      id: createRecordId("source"),
      title: title.trim() || "Kaynak",
      url: url.trim(),
      source,
      openedAt: new Date().toISOString(),
      operationId: operationId || createRecordId("op"),
      status,
      note,
    };
    setOpenedSourcePreviews((current) => [preview, ...current].slice(0, 60));
    return preview;
  }

  function openCapabilityResearchUrl(
    url: string,
    title = "Araştırma kaynağı",
    source: UpgradeActionSource | "capability-research" = "capability-research",
    operationId?: string
  ) {
    if (!requireProductOn("Araştırma bağlantısı")) return;
    if (!requireOnlineAccess("Araştırma bağlantısı")) return;
    window.open(url, "_blank", "noopener,noreferrer");
    const preview = registerOpenedSourcePreview({
      title,
      url,
      source,
      status: "opened",
      note: "Bağlantı yeni sekmede açıldı.",
      operationId,
    });
    addActivityLog("Araştırma bağlantısı açıldı.", "info", preview.operationId);
  }

  async function copyCodingSearchQuery(query: string) {
    if (!requireProductOn("Kodlama sorgusu kopyalama")) return;
    try {
      await navigator.clipboard.writeText(query);
      setCodingMessage("Arama sorgusu panoya kopyalandı.");
      addActivityLog("Kodlama sorgusu panoya kopyalandı.", "success");
    } catch {
      setCodingMessage("Panoya kopyalanamadı; sorgu altta görünüyor.");
      addActivityLog("Kodlama sorgusu panoya kopyalanamadı.", "warn");
    }
  }

  async function runEmbeddedTerminalCommand() {
    if (!requireProductOn("Terminal komutu")) return;
    if (!isAdmin) {
      setTerminalError("Terminal yalnızca admin kullanıcı için açıktır.");
      return;
    }

    const command = terminalInput.trim();
    if (!command || terminalRunning) return;

    if (!isRunningInTauri()) {
      setTerminalError(
        "Bu terminal yalnızca Tauri masaüstü uygulamasında çalışır. Tarayıcı modunda komut yürütülmez."
      );
      return;
    }

    setTerminalRunning(true);
    setTerminalError("");

    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const result = (await invoke("run_core_terminal", {
        command,
      })) as {
        command: string;
        stdout: string;
        stderr: string;
        statusCode?: number;
        status_code: number;
      };

      const entry: TerminalRunEntry = {
        id: createRecordId("terminal"),
        at: new Date().toISOString(),
        command: result.command || command,
        stdout: result.stdout || "",
        stderr: result.stderr || "",
        statusCode:
          typeof result.statusCode === "number"
            ? result.statusCode
            : typeof result.status_code === "number"
            ? result.status_code
            : -1,
      };

      setTerminalHistory((current) => [entry, ...current].slice(0, 120));
      setTerminalInput("");
      addActivityLog(`Terminal komutu çalıştırıldı: ${command}`, "info");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Komut çalıştırılamadı.";
      setTerminalError(message);
      addActivityLog(`Terminal komutu başarısız: ${command}`, "error");
    } finally {
      setTerminalRunning(false);
    }
  }

  async function addPendingChatUploadFiles(files: File[]) {
    if (!requireProductOn("Sohbet dosya yükleme")) return;
    if (files.length === 0) return;

    const nextUploads = await Promise.all(
      files.map(async (file) => {
        const kind = getChatUploadKind(file);
        let textSnippet: string | undefined;

        if (kind === "text" && file.size <= 1024 * 1024 * 2) {
          try {
            const raw = await file.text();
            textSnippet = raw.replace(/\s+/g, " ").trim().slice(0, 1200);
          } catch {
            textSnippet = undefined;
          }
        }

        return {
          id: createRecordId("chat-upload"),
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          kind,
          textSnippet,
        } as PendingChatUpload;
      })
    );

    setPendingChatUploads((current) => [...current, ...nextUploads].slice(-20));
    setChatUploadMessage(
      uiLanguage === "en"
        ? `${nextUploads.length} file(s) attached.`
        : `${nextUploads.length} dosya eklendi.`
    );
    setChatDropActive(false);
    addActivityLog(`${nextUploads.length} dosya sohbete eklendi.`, "info");
  }

  async function handleChatUploadSelection(event: ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;
    await addPendingChatUploadFiles(Array.from(fileList));
    event.target.value = "";
  }

  function removePendingChatUpload(uploadId: string) {
    setPendingChatUploads((current) =>
      current.filter((item) => item.id !== uploadId)
    );
  }

  function openChatAttachmentPicker() {
    chatUploadInputRef.current?.click();
    setChatActionMenuOpen(false);
  }

  async function notifyExternalConversation(
    title: string,
    body: string,
    options?: NotificationOptions
  ) {
    if (!("Notification" in window)) return;

    try {
      if (Notification.permission === "granted") {
        new Notification(title, { body, ...(options || {}) });
        return;
      }

      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          new Notification(title, { body, ...(options || {}) });
        }
      }
    } catch {
      // Bildirim API hataları için sessiz geç.
    }
  }

  function applyShareSessionUpdate(
    sessionId: string,
    updater: (session: ShareLinkSession) => ShareLinkSession
  ) {
    let updatedSession: ShareLinkSession | null = null;
    setShareLinkSessions((current) => {
      const target = current.find((item) => item.id === sessionId);
      if (!target) return current;
      updatedSession = updater(target);
      return current.map((item) => (item.id === sessionId ? updatedSession! : item));
    });

    if (updatedSession) {
      setExternalConversations((current) =>
        mergeExternalConversationFromSession(current, updatedSession!)
      );
    }
  }

  async function sendGuestShareMessage() {
    if (!isGuestShareMode || !guestShareSession) return;
    const text = guestInput.trim();
    if (!text || guestLoading) return;

    const nowIso = new Date().toISOString();
    const currentUserCount = guestMessages.filter(
      (message) => message.role === "user"
    ).length;
    if (currentUserCount >= guestShareSession.maxMessages) {
      setGuestError("Bu görüşme için mesaj sınırı doldu. Admin ile paylaşıldı.");
      return;
    }

    if (guestShareSession.status !== "active") {
      setGuestError("Bu paylaşım linki aktif değil.");
      return;
    }

    const expiresAtMs = Date.parse(guestShareSession.expiresAt);
    if (!Number.isNaN(expiresAtMs) && expiresAtMs <= Date.now()) {
      setGuestError("Bu paylaşım linkinin süresi doldu.");
      applyShareSessionUpdate(guestShareSession.id, (session) => ({
        ...session,
        status: "expired",
      }));
      return;
    }

    setGuestError("");
    setGuestMessage("");
    setGuestLoading(true);

    const guestProfileLabel = guestDisplayName.trim();
    const userMessage: Message = {
      role: "user",
      content: text,
    };
    const nextMessages = [...guestMessages, userMessage];
    setGuestMessages(nextMessages);
    setGuestInput("");

    const guestSystemPrompt = [
      "You are OC guest conversation mode.",
      "This is a delegated guest conversation link. No login is required.",
      `Main topic: ${guestShareSession.topic}`,
      `Conversation instruction: ${guestShareSession.instruction}`,
      "Keep questions focused on the given topic.",
      "Do not request unnecessary personal data.",
      "Do not expose hidden system or admin internals.",
      "At natural completion, provide a short summary and state that summary will be sent to the admin.",
      "Answer in the same language the guest uses.",
    ].join("\n");

    try {
      const assistantReply = await requestChat(nextMessages, model, guestSystemPrompt);

      const assistantMessage: Message = {
        role: "assistant",
        content: assistantReply,
      };
      const transcript = [...nextMessages, assistantMessage];
      setGuestMessages(transcript);

      const newUserCount = transcript.filter((message) => message.role === "user").length;
      const reachedLimit = newUserCount >= guestShareSession.maxMessages;
      const nextStatus: ShareLinkSessionStatus = reachedLimit ? "completed" : "active";

      applyShareSessionUpdate(guestShareSession.id, (session) => ({
        ...session,
        guestDisplayName: guestProfileLabel || session.guestDisplayName,
        transcript,
        lastMessageAt: nowIso,
        status: nextStatus,
        completedAt: reachedLimit ? nowIso : session.completedAt,
      }));

      if (reachedLimit) {
        setGuestMessage(
          "Görüşme tamamlandı. Bu konuşma admin tarafa özetlenmek üzere kaydedildi."
        );
      } else {
        setGuestMessage("Mesajın kaydedildi. Konuyu netleştirmek için devam edebilirsin.");
      }

      addActivityLog(
        reachedLimit
          ? `Dis gorusme tamamlandi: ${guestShareSession.topic}`
          : `Dis gorusmede yeni mesaj: ${guestShareSession.topic}`,
        reachedLimit ? "success" : "info"
      );

      await notifyExternalConversation(
        reachedLimit ? "Dis gorusme tamamlandi" : "Dis gorusmede yeni mesaj",
        `${guestShareSession.topic} - ${guestShareSession.recipientLabel}`
      );
    } catch (error) {
      const message =
        error instanceof Error && error.message === "MODEL_NOT_FOUND"
          ? `Secili model (${model}) yuku degil. Admin tarafinda modeli yuklemek gerekir.`
          : "Yanıt alinamadi. Lutfen birazdan tekrar dene.";
      setGuestError(message);
      setGuestMessages((current) => current.slice(0, -1));
    } finally {
      setGuestLoading(false);
    }
  }

  function createShareChatLink() {
    if (!requireProductOn("Sohbet linki oluşturma")) return;
    if (!isAdmin) {
      setShareLinkError("Sohbet linki oluşturma yalnızca admin kullanıcıya açıktır.");
      return;
    }

    const recipientLabel = shareLinkRecipient.trim();
    const topic = shareLinkTopic.trim();
    const instruction = shareLinkInstruction.trim();
    const maxMessages = Number.parseInt(shareLinkMaxMessages, 10);
    const expireHours = Number.parseInt(shareLinkExpireHours, 10);

    setShareLinkMessage("");
    setShareLinkError("");

    if (!recipientLabel) {
      setShareLinkError("Kimle paylaşacağını yaz.");
      return;
    }

    if (!topic) {
      setShareLinkError("Ne hakkinda oldugunu yaz.");
      return;
    }

    if (!instruction) {
      setShareLinkError("Bota verilecek talimati yaz.");
      return;
    }

    if (!Number.isFinite(maxMessages) || maxMessages < 3 || maxMessages > 200) {
      setShareLinkError("Maksimum mesaj sayisi 3 ile 200 arasinda olmali.");
      return;
    }

    if (!Number.isFinite(expireHours) || expireHours < 1 || expireHours > 720) {
      setShareLinkError("Link suresi 1 ile 720 saat arasinda olmali.");
      return;
    }

    const sessionId = createRecordId("share");
    const createdAtIso = new Date().toISOString();
    const expiresAtIso = new Date(
      Date.now() + expireHours * 60 * 60 * 1000
    ).toISOString();
    const baseUrl = window.location.origin;
    const shareBasePath = resolveShareBasePath(window.location.pathname);
    const sharePath = `${shareBasePath}/share/s/${sessionId}`.replace(/\/{2,}/g, "/");
    const shareUrl = `${baseUrl}${sharePath}`;

    const session: ShareLinkSession = {
      id: sessionId,
      createdAt: createdAtIso,
      createdBy: sessionUsername,
      recipientLabel,
      topic,
      instruction,
      maxMessages,
      expiresAt: expiresAtIso,
      status: "active",
      url: shareUrl,
      transcript: [],
    };

    setShareLinkSessions((current) => [session, ...current].slice(0, 120));
    setExternalConversations((current) =>
      mergeExternalConversationFromSession(current, session)
    );
    setShareLinkMessage("Sohbet linki oluşturuldu. Alttaki listeden kopyalayabilirsin.");
    setShareLinkRecipient("");
    setShareLinkTopic("");
    setShareLinkInstruction("");
    setShareLinkMaxMessages("12");
    setShareLinkExpireHours("24");
    setShareLinkCreatorOpen(false);
    setChatActionMenuOpen(false);
    setChatPanelTab("sessions");
    addActivityLog(`Sohbet linki oluşturuldu: ${topic}`, "success");
  }

  async function copyShareLink(session: ShareLinkSession) {
    if (!requireProductOn("Sohbet linki kopyalama")) return;

    try {
      await navigator.clipboard.writeText(session.url);
      setShareLinkMessage(`Link panoya kopyalandi: ${session.topic}`);
      setShareLinkError("");
      addActivityLog("Sohbet linki panoya kopyalandi.", "info");
    } catch {
      setShareLinkError("Link panoya kopyalanamadi. Elle kopyalayabilirsin.");
      addActivityLog("Sohbet linki panoya kopyalanamadi.", "warn");
    }
  }

  function openShareSessionInThisDevice(session: ShareLinkSession) {
    if (!requireProductOn("Sohbet linki acma")) return;
    let sharePath = "";
    try {
      sharePath = new URL(session.url).pathname;
    } catch {
      sharePath = `/share/s/${session.id}`;
    }
    window.history.pushState({}, "", sharePath);
    setShareSessionPathId(session.id);
    addActivityLog(`Sohbet linki bu cihazda acildi: ${session.topic}`, "info");
  }

  function revokeShareLink(sessionId: string) {
    if (!requireProductOn("Sohbet linki kapatma")) return;
    if (!isAdmin) return;

    applyShareSessionUpdate(sessionId, (session) => ({
      ...session,
      status: session.status === "completed" ? "completed" : "revoked",
      completedAt:
        session.status === "completed" ? session.completedAt : new Date().toISOString(),
    }));
    setShareLinkMessage("Sohbet linki pasif duruma alindi.");
    setShareLinkError("");
    addActivityLog("Sohbet linki kapatildi.", "warn");
  }

  async function sendMessage() {
    if (!requireProductOn("Sohbet gönderimi")) return;
    const text = input.trim();
    const hasUploads = pendingChatUploads.length > 0;
    if ((!text && !hasUploads) || loading) return;
    addActivityLog("Sohbet gönderildi.", "info");

    if (isRestricted) {
      const appendRestrictedReply = (current: Message[]): Message[] => [
        ...current,
        {
          role: "assistant",
          content:
            "Lisans geçerli değil. OC şu anda sınırlı modda. Chat özelliğini kullanmak için EULA/Gizlilik kabulü ve geçerli bir License Token gerekiyor.",
        },
      ];
      if (isTemporarySession) {
        setTemporaryMessages((current) => appendRestrictedReply(current));
      } else {
        setMessages((current) => appendRestrictedReply(current));
      }
      return;
    }

    const attachmentLines = pendingChatUploads.map(
      (upload) =>
        `- ${formatChatUploadKind(upload.kind, uiLanguage)}: ${upload.fileName} (${Math.max(
          1,
          Math.round(upload.size / 1024)
        )} KB)`
    );
    const attachmentSnippets = pendingChatUploads
      .filter((upload) => upload.textSnippet)
      .map(
        (upload) =>
          `[${upload.fileName}] ${upload.textSnippet ? upload.textSnippet : ""}`
      );
    const userContent = [
      text || (uiLanguage === "en" ? "Attached materials shared." : "Ek materyal paylaşıldı."),
      ...(attachmentLines.length > 0
        ? [
            uiLanguage === "en" ? "Attachments:" : "Ekler:",
            ...attachmentLines,
          ]
        : []),
      ...(attachmentSnippets.length > 0
        ? [
            uiLanguage === "en"
              ? "Text excerpts from uploaded files:"
              : "Yüklenen metin dosyalarından kısa alıntılar:",
            ...attachmentSnippets,
          ]
        : []),
    ]
      .join("\n")
      .trim();

    const nextMessages: Message[] = [
      ...visibleChatMessages,
      {
        role: "user",
        content: userContent,
      },
    ];
    const contextMessages = buildChatContextMessages(nextMessages);
    const requestMessages =
      contextMessages.length > 0
        ? contextMessages
        : [
            {
              role: "user" as const,
              content: text,
            },
          ];

    if (isTemporarySession) {
      setTemporaryMessages(nextMessages);
    } else {
      setMessages(nextMessages);
    }
    setInput("");
    setPendingChatUploads([]);
    setChatUploadMessage("");
    setLoading(true);

    try {
      const localScienceContext = await buildLocalScienceContext(userContent);
      const effectiveSystemPrompt = localScienceContext
        ? `${systemPrompt}\n\nLOCAL SCIENCE ENGINE CONTEXT:\n${localScienceContext}`
        : systemPrompt;
      if (localScienceContext) {
        addActivityLog("Yerel bilimsel hesaplama motoru çalıştı: mathjs", "success");
      }

      const reply = await requestChat(requestMessages, model, effectiveSystemPrompt);
      if (!productEnabledRef.current) return;

      const appendAssistant = (current: Message[]): Message[] => [
        ...current,
        {
          role: "assistant",
          content: reply,
        },
      ];

      if (isTemporarySession) {
        setTemporaryMessages((current) => appendAssistant(current));
      } else {
        setMessages((current) => appendAssistant(current));
      }

      setOllamaStatus("online");
      addActivityLog("Ollama yanıt verdi.", "success");
    } catch (error) {
      if (!productEnabledRef.current) return;
      const isModelError =
        error instanceof Error && error.message === "MODEL_NOT_FOUND";

      if (isModelError) {
        try {
          const fallbackModel = await findInstalledModel(model);
          if (!productEnabledRef.current) return;

          if (fallbackModel && fallbackModel !== model) {
            const reply = await requestChat(
              requestMessages,
              fallbackModel,
              systemPrompt
            );
            if (!productEnabledRef.current) return;

            const fallbackReply: Message = {
              role: "assistant",
              content: `Aktif model ${fallbackModel} olarak güncellendi.\n\n${reply}`,
            };
            if (isTemporarySession) {
              setTemporaryMessages((current) => [...current, fallbackReply]);
            } else {
              setMessages((current) => [...current, fallbackReply]);
            }
            addActivityLog(`Model bulunamadı, yüklü modele geçildi: ${fallbackModel}`, "warn");
            return;
          }
        } catch {
          setOllamaStatus("offline");
        }
      }

      const connectionReply: Message = {
        role: "assistant",
        content: isModelError
          ? `Ollama çalışıyor, ancak seçili model (${model}) bu makinede yüklü değil. Modeller ekranında bağlantıyı kontrol et; model listesi boşsa terminalde \`ollama pull llama3.2:3b\` veya çok dilli kalite için \`ollama pull gemma3:4b\` çalıştır.`
          : "Ollama'ya bağlanamadım. Terminalde `ollama serve` çalışıyor mu kontrol edelim. Ollama açıksa modelin yüklü olduğundan emin ol.",
      };
      if (isTemporarySession) {
        setTemporaryMessages((current) => [...current, connectionReply]);
      } else {
        setMessages((current) => [...current, connectionReply]);
      }
      setOllamaStatus(isModelError ? "online" : "offline");
      addActivityLog(
        isModelError
          ? "Seçili model bulunamadı."
          : "Ollama bağlantısı başarısız.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  async function sendCodingMessage() {
    if (!requireProductOn("Kodlama sohbeti")) return;
    const text = codingInput.trim();
    if (!text || codingLoading) return;
    addActivityLog("Kodlama sohbeti gönderildi.", "info");

    if (isRestricted) {
      setCodingMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "Lisans geçerli değil. Kodlama sohbeti şu anda sınırlı modda. Geçerli lisansla bu alanı açabiliriz.",
        },
      ]);
      return;
    }

    const nextMessages: Message[] = [
      ...codingMessages,
      {
        role: "user",
        content: text,
      },
    ];

    setCodingMessages(nextMessages);
    setCodingInput("");
    setCodingLoading(true);

    try {
      const reply = await requestModelText(nextMessages, codingModel, codingSystemPrompt);
      if (!productEnabledRef.current) return;

      setCodingMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: reply,
        },
      ]);

      setOllamaStatus("online");
      addActivityLog("Kodlama modeli yanıt verdi.", "success");
    } catch (error) {
      if (!productEnabledRef.current) return;
      const isModelError =
        error instanceof Error && error.message === "MODEL_NOT_FOUND";

      setCodingMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: isModelError
            ? `Kodlama modeli (${codingModel}) bu makinede yüklü değil. Modeller ekranından kontrol et veya terminalde \`ollama pull ${codingModel}\` çalıştır.`
            : "Kodlama modeli yanıt veremedi. Ollama bağlantısını ve seçili kodlama modelini kontrol edelim.",
        },
      ]);
      setOllamaStatus(isModelError ? "online" : "offline");
      addActivityLog(
        isModelError ? "Kodlama modeli bulunamadı." : "Kodlama sohbeti başarısız.",
        "error"
      );
    } finally {
      setCodingLoading(false);
    }
  }

  function statusText(status: Capability["status"]) {
    if (status === "active") return "Aktif";
    if (status === "ready") return "Hazır";
    if (status === "planned") return "Hazırlanıyor";
    if (status === "restricted") return "Sınırlı";
    if (status === "offline") return "Offline";
    return status;
  }

  function licenseText(status: LicenseStatus) {
    if (status === "valid") return "Geçerli";
    if (status === "invalid") return "Geçersiz";
    if (status === "restricted") return "Sınırlı mod";
    return "Token yok";
  }

  function renderCapabilityCard(capability: CapabilityCard) {
    const isMenuOpen = capabilityMenuOpenId === capability.id;
    const isEditing = editingCapabilityId === capability.id;
    const isCustomCapability =
      "isCustom" in capability && capability.isCustom === true;
    const isPaused = Boolean(capability.isPaused);
    const statusLabel = isPaused ? "Pasif" : statusText(capability.status);
    const statusClass = isPaused ? "paused" : capability.status;
    const isDragging = draggedCapabilityId === capability.id;
    const isDropTarget = dropTargetCapabilityId === capability.id;

    return (
      <article
        className={`card capability-card ${
          capability.isArchived ? "archived" : ""
        } ${isPaused ? "paused" : ""} ${isDragging ? "dragging" : ""} ${
          isDropTarget ? "drop-target" : ""
        }`}
        key={capability.id}
        onDragOver={(event) => {
          event.preventDefault();
          if (draggedCapabilityId && draggedCapabilityId !== capability.id) {
            setDropTargetCapabilityId(capability.id);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          if (draggedCapabilityId && draggedCapabilityId !== capability.id) {
            moveCapabilityOrder(draggedCapabilityId, capability.id);
          }
          setDraggedCapabilityId(null);
          setDropTargetCapabilityId(null);
        }}
        onDragLeave={() => {
          setDropTargetCapabilityId((current) =>
            current === capability.id ? null : current
          );
        }}
      >
        <div className="card-menu-wrap">
          <button
            className="card-drag-handle"
            draggable
            onDragStart={() => {
              setCapabilityMenuOpenId(null);
              setDraggedCapabilityId(capability.id);
              setDropTargetCapabilityId(null);
            }}
            onDragEnd={() => {
              setDraggedCapabilityId(null);
              setDropTargetCapabilityId(null);
            }}
            aria-label={`${capability.name} önceliğini sürükle`}
            title="Sürükle ve sırayı değiştir"
          >
            <span />
            <span />
            <span />
          </button>

          <button
            className="card-menu-button"
            onClick={() => openCapabilityMenu(capability)}
            aria-label={`${capability.name} menüsü`}
          >
            <span />
            <span />
            <span />
          </button>

          {isMenuOpen && (
            <div className="card-menu">
              <button onClick={() => startEditingCapability(capability)}>
                Düzenle
              </button>
              <button onClick={() => tidyCapability(capability.id)}>
                Uygun hale getir
              </button>
              <button onClick={() => developCapability(capability.id)}>
                Geliştir
              </button>
              <button onClick={() => toggleCapabilityPause(capability.id)}>
                {isPaused ? "Aktife al" : "Pasif et"}
              </button>
              <button onClick={() => toggleCapabilityArchive(capability.id)}>
                {capability.isArchived ? "Arşivden çıkar" : "Arşivle"}
              </button>
              <button
                className="danger-button"
                onClick={() => removeCapability(capability.id)}
                disabled={!isCustomCapability}
              >
                Kaldır
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="card-top">
            <h3>{capability.name}</h3>
            <span className={`badge ${statusClass}`}>{statusLabel}</span>
          </div>
          <p>{capability.description}</p>
        </div>

        {isEditing ? (
          <div className="capability-edit-box">
            <label className="field">
              <span>Başlık</span>
              <input
                value={editingCapabilityName}
                onChange={(event) => setEditingCapabilityName(event.target.value)}
              />
            </label>
            <label className="field field-wide">
              <span>Açıklama</span>
              <textarea
                value={editingCapabilityDescription}
                onChange={(event) =>
                  setEditingCapabilityDescription(event.target.value)
                }
              />
            </label>
            <div className="card-actions-inline">
              <button onClick={saveCapabilityEdit}>Kaydet</button>
              <button className="muted-button" onClick={cancelCapabilityEdit}>
                İptal
              </button>
            </div>
          </div>
        ) : (
          <div className="card-actions">
            <small>
              {capability.source === "core"
                ? "çekirdek yetenek"
                : "kullanıcı yeteneği"}
            </small>
            {capability.isArchived && <span className="archived-label">Arşivli</span>}
            {isPaused && <span className="paused-label">Pasif</span>}
          </div>
        )}
      </article>
    );
  }

  if (isGuestShareMode) {
    const shareSession = guestShareSession;
    const isMissing = !shareSession;
    const isClosed = Boolean(shareSession && shareSession.status !== "active");
    const sessionStatusLabel = shareSession
      ? shareSession.status === "active"
        ? "Aktif"
        : shareSession.status === "completed"
        ? "Tamamlandi"
        : shareSession.status === "expired"
        ? "Suresi doldu"
        : "Kapatildi"
      : "Bulunamadi";

    return (
      <div className="auth-shell guest-shell">
        <section className="auth-card guest-card">
          <div className="brand">
            <div className="logo">I</div>
            <div>
              <h1>OC</h1>
              <p>Misafir gorusme baglantisi</p>
            </div>
          </div>

          <div>
            <h2>Kisa gorusme oturumu</h2>
            <p className="hint">
              Bu gorusme icin kullanici girisi gerekmez. Yanitlar yalnizca verilen
              konu kapsamında kaydedilir ve admin özetine eklenir.
            </p>
          </div>

          {shareSession && (
            <div className="info-box chat-share-box">
              <strong>{shareSession.topic}</strong>
              <p className="hint">
                Kisi: {shareSession.recipientLabel} • Durum: {sessionStatusLabel}
              </p>
              <p className="hint">
                Mesaj limiti: {shareSession.maxMessages} • Bitis:{" "}
                {new Date(shareSession.expiresAt).toLocaleString("tr-TR")}
              </p>
            </div>
          )}

          {isMissing ? (
            <p className="error-text">
              Bu paylaşım linki bulunamadı. Linki oluşturan kişiden yeni link
              istemelisin.
            </p>
          ) : (
            <>
              <label className="field">
                <span>Adin (opsiyonel)</span>
                <input
                  value={guestDisplayName}
                  onChange={(event) => setGuestDisplayName(event.target.value)}
                  placeholder="Orn: Ahmet"
                  disabled={isClosed}
                />
              </label>

              <div className="messages guest-messages" ref={guestMessagesRef}>
                {guestMessages.map((message, index) => (
                  <div key={index} className={`message ${message.role}`}>
                    <div className="message-head">
                      {message.role === "assistant" && (
                        <img
                          className="message-avatar"
                          src={assistantAvatarDataUrl}
                          alt="OC avatar"
                        />
                      )}
                      <b>{message.role === "user" ? "Misafir" : "OC"}</b>
                    </div>
                    <p>{message.content}</p>
                  </div>
                ))}

                {guestLoading && (
                  <div className="message assistant">
                    <div className="message-head">
                      <img
                        className="message-avatar"
                        src={assistantAvatarDataUrl}
                        alt="OC avatar"
                      />
                      <b>OC</b>
                    </div>
                    <p>Dusunuyorum...</p>
                  </div>
                )}
              </div>

              {guestMessage && <p className="ok-text">{guestMessage}</p>}
              {guestError && <p className="error-text">{guestError}</p>}

              <div className="composer">
                <textarea
                  value={guestInput}
                  onChange={(event) => setGuestInput(event.target.value)}
                  disabled={isClosed || guestLoading}
                  placeholder={
                    isClosed
                      ? "Bu gorusme oturumu aktif degil."
                      : "Konuya dair yanitini yaz..."
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendGuestShareMessage();
                    }
                  }}
                />
                <button
                  onClick={sendGuestShareMessage}
                  disabled={isClosed || guestLoading || !guestInput.trim()}
                >
                  Gonder
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-shell">
        <section className="auth-card">
          <div className="brand">
            <div className="logo">I</div>
            <div>
              <h1>OC</h1>
              <p>Yerel AI çekirdeği</p>
            </div>
          </div>

          <div>
            <h2>Hesapla giriş yap</h2>
            <p className="hint">
              Kullanıcı adı ve şifre ile yerel oturum aç. Hesaplar ve oturum
              bilgisi bu cihazda saklanır. Yeni hesaplar admin onayına düşer.
              İlk kurulum admin kimliği: {MASTER_ADMIN_PROFILE.email} /{" "}
              {MASTER_ADMIN_PROFILE.phone}.
            </p>
          </div>

          <div className="auth-switch">
            <button
              className={authMode === "login" ? "active" : ""}
              onClick={() => setAuthMode("login")}
            >
              Giriş yap
            </button>
            <button
              className={authMode === "register" ? "active" : ""}
              onClick={() => setAuthMode("register")}
            >
              Hesap oluştur
            </button>
            <button
              className={authMode === "recover" ? "active" : ""}
              onClick={() => setAuthMode("recover")}
            >
              Şifremi unuttum
            </button>
          </div>

          {authMode !== "recover" ? (
            <div className="auth-form">
              <label className="field">
                <span>Kullanıcı adı</span>
                <input
                  value={authUsername}
                  onChange={(event) => setAuthUsername(event.target.value)}
                  placeholder="ben"
                  autoComplete="username"
                />
              </label>

              <label className="field">
                <span>Şifre</span>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  placeholder="********"
                  autoComplete={
                    authMode === "login" ? "current-password" : "new-password"
                  }
                />
              </label>

              {authMode === "register" && (
                <label className="field">
                  <span>Şifre tekrar</span>
                  <input
                    type="password"
                    value={authConfirmPassword}
                    onChange={(event) =>
                      setAuthConfirmPassword(event.target.value)
                    }
                    placeholder="********"
                    autoComplete="new-password"
                  />
                </label>
              )}

              <button onClick={handleAuthSubmit}>
                {authMode === "login" ? "Giriş yap" : "Hesap oluştur"}
              </button>
            </div>
          ) : (
            <div className="auth-form">
              <label className="field">
                <span>Admin kimliği (e-posta veya telefon)</span>
                <input
                  value={authUsername}
                  onChange={(event) => setAuthUsername(event.target.value)}
                  placeholder={MASTER_ADMIN_PROFILE.email}
                  autoComplete="username"
                />
              </label>

              <button className="muted-button" onClick={startPasswordRecovery}>
                Kurtarma adımını başlat
              </button>

              {recoveryAttempt && (
                <>
                  <p className="hint">
                    Deneme: {recoveryAttempt.id} • Bitiş:{" "}
                    {new Date(recoveryAttempt.expiresAt).toLocaleString("tr-TR")}
                  </p>

                  <label className="field">
                    <span>Sabit admin e-posta doğrulaması</span>
                    <input
                      value={recoveryEmail}
                      onChange={(event) => setRecoveryEmail(event.target.value)}
                      placeholder={MASTER_ADMIN_PROFILE.email}
                      autoComplete="email"
                    />
                  </label>

                  <label className="field">
                    <span>{recoveryAttempt.questions[0]?.text}</span>
                    <input
                      value={recoveryAnswerOne}
                      onChange={(event) => setRecoveryAnswerOne(event.target.value)}
                      placeholder="Yanıt"
                    />
                  </label>

                  <label className="field">
                    <span>{recoveryAttempt.questions[1]?.text}</span>
                    <input
                      value={recoveryAnswerTwo}
                      onChange={(event) => setRecoveryAnswerTwo(event.target.value)}
                      placeholder="Yanıt"
                    />
                  </label>

                  <button onClick={verifyPasswordRecovery}>
                    Soruları doğrula
                  </button>

                  {recoveryAttempt.verified && (
                    <>
                      <label className="field">
                        <span>Geçici profil gerekçesi</span>
                        <input
                          value={recoveryReason}
                          onChange={(event) => setRecoveryReason(event.target.value)}
                          placeholder="Örn: Şifre unutma, admin acil erişim"
                        />
                      </label>
                      <button onClick={issueTemporaryAccessProfile}>
                        Geçici kısıtlı profil aç
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {authMessage && <p className="ok-text">{authMessage}</p>}
          {authError && <p className="error-text">{authError}</p>}

          <div className="warning">
            Bu giriş sistemi yerel prototiptir. Şifreler bu cihazda hashlenmiş
            olarak saklanır; gerçek sürümde Rust/Tauri tarafı doğrulaması
            eklenecek.
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={`app ${isProductOff ? "product-off" : ""}`}>
      <aside className="sidebar">
        <div className="brand">
          <button
            className={`logo logo-toggle ${isProductOff ? "off" : "on"}`}
            onClick={toggleProductPower}
            type="button"
            aria-label={isProductOff ? "Ürünü aç" : "Ürünü kapat"}
            aria-pressed={!isProductOff}
          >
            <span className="logo-symbol">{isProductOff ? "0" : "1"}</span>
          </button>
          <div>
            <h1>OC</h1>
            <p>Yerel AI çekirdeği</p>
          </div>
        </div>

        <nav inert={isProductOff}>
          <button
            className={page === "chat" ? "active" : ""}
            onClick={() => setPage("chat")}
            disabled={isProductOff}
          >
            Sohbet
          </button>

          {(isAdmin || isTemporarySession) && (
            <>
              <button
                className={page === "hub" ? "active" : ""}
                onClick={() => openHubTab("capabilities")}
                disabled={isProductOff}
              >
                Geliştirme Merkezi
              </button>

              {isAdmin && (
                <>
                  <button
                    className={page === "terminal" ? "active" : ""}
                    onClick={() => setPage("terminal")}
                    disabled={isProductOff}
                  >
                    Terminal
                  </button>

                  <button
                    className={page === "continuation" ? "active" : ""}
                    onClick={() => setPage("continuation")}
                    disabled={isProductOff}
                  >
                    Devam
                  </button>

                  <button
                    className={page === "persona" ? "active" : ""}
                    onClick={() => setPage("persona")}
                    disabled={isProductOff}
                  >
                    Persona
                  </button>
                  <button
                    className={page === "license" ? "active" : ""}
                    onClick={() => setPage("license")}
                    disabled={isProductOff}
                  >
                    Lisans
                  </button>

                  <button
                    className={page === "settings" ? "active" : ""}
                    onClick={() => setPage("settings")}
                    disabled={isProductOff}
                  >
                    Ayarlar
                  </button>
                </>
              )}
            </>
          )}
        </nav>

        <div className="status">
          <span>Oturum</span>
          <strong>{currentSessionLabel}</strong>

          <span>Rol</span>
          <strong>{currentRoleLabel}</strong>

          <span>Onay</span>
          <strong className={currentAccount?.approvalStatus === "approved" ? "ok" : "warn"}>
            {isTemporarySession
              ? "Geçici"
              : currentAccount?.approvalStatus === "approved"
              ? "Onaylı"
              : currentAccount
              ? "Onay bekliyor"
              : "-"}
          </strong>

          <span>Erişim</span>
          <strong className={currentAccount?.accessStatus === "inactive" ? "warn" : "ok"}>
            {isTemporarySession
              ? "Kısıtlı"
              : currentAccount?.accessStatus === "inactive"
              ? "Pasif"
              : "Aktif"}
          </strong>

          <button
            className="logout-button"
            onClick={handleLogout}
            disabled={isProductOff}
          >
            Çıkış yap
          </button>

          {isTemporarySession && (
            <button
              className="logout-button"
              onClick={closeTemporaryAccessProfile}
              disabled={isProductOff}
            >
              Geçici profili kapat
            </button>
          )}

          <span>Aktif model</span>
          <strong>{model}</strong>

          <span>Kodlama modeli</span>
          <strong>{codingModel}</strong>

          <span>Aktif paket</span>
          <strong>{activePack ? activePack.name : "Yok"}</strong>

          <span>Lisans</span>
          <strong className={isLicensed ? "ok" : "warn"}>
            {licenseText(licenseStatus)}
          </strong>

          <span>Ollama</span>
          <strong className={ollamaStatus === "online" ? "ok" : "warn"}>
            {ollamaStatus === "online"
              ? "Bağlı"
              : ollamaStatus === "offline"
              ? "Kapalı"
              : "Kontrol edilmedi"}
          </strong>

          <span>Online erişim</span>
          <strong className={onlineAccessEnabled ? "ok" : "warn"}>
            {onlineAccessEnabled ? "✓ Açık" : "Kapalı"}
          </strong>

          <span>Ürün</span>
          <strong className={isProductOff ? "warn" : "ok"}>
            {isProductOff ? "Kapalı" : "Açık"}
          </strong>

          <span>Anlık durum</span>
          <strong>{currentStatus}</strong>

          {productStatusMessage && (
            <p className="status-note">{productStatusMessage}</p>
          )}

          <div className="status-log">
            <div className="status-log-head">
              <strong>Akış</strong>
              <span>{activityLog.length} kayıt</span>
            </div>

            <div className="status-log-list">
              {activityLog.slice(0, 8).map((entry) => (
                <div key={entry.id} className={`status-log-item ${entry.tone}`}>
                  <span className="status-log-time">
                    {new Date(entry.at).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                  <span className="status-log-text">
                    {entry.operationId ? `[${entry.operationId}] ` : ""}
                    {entry.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <main className="main" inert={isProductOff}>
        {page === "hub" && (
          <section className="panel">
            <header>
              <div>
                <h2>Geliştirme Merkezi</h2>
                <p>
                  Yetenekler, yükseltmeler, paketler, depo, kodlama ve modeller tek
                  merkezden yönetilir. Araştır, öner, ekle ve kaldır akışı aynı
                  yerde kalır.
                </p>
              </div>
              <span className="pill">Hub</span>
            </header>

            <div className="hub-tabs">
              {visibleHubTabs.map((tab) => (
                <button
                  key={tab}
                  className={hubTab === tab ? "active" : ""}
                  onClick={() => setHubTab(tab)}
                >
                  {hubTabLabels[tab]}
                </button>
              ))}
            </div>

            <div className="warning">
              Bu merkez otomatik ekleme akışına bağlıdır. “Yükselt”, “Ekle” ve
              “Kaldır” eylemleri mümkün olduğunda ilgili hedefe doğrudan işler.
            </div>

            {isTemporarySession && (
              <div className="warning">
                Geçici kısıtlı profildesin. Bu ekranda yapılan değişiklikler doğrudan
                yazılmaz, admin onay kuyruğuna alınır.
              </div>
            )}

            <p className="hint">
              Aktif odak: <strong>{activeHubLabel}</strong>
            </p>

            <section className="continuation-box master-plan-box">
              <div className="upgrade-engine-head">
                <div>
                  <strong>Master plan</strong>
                  <p className="hint">
                    Canlı durumdan üretilen tek merkezli yol haritası. Hub
                    tab'ları buradan açılır.
                  </p>
                </div>
                <span className="pill">{masterPlanPreview.nextPageLabel}</span>
              </div>

              <p>{masterPlanPreview.handoff}</p>

              <div className="upgrade-engine-grid">
                <article className="upgrade-engine-card">
                  <strong>Korunacaklar</strong>
                  <ul>
                    {masterPlanPreview.carryForward.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>

                <article className="upgrade-engine-card">
                  <strong>İlk adımlar</strong>
                  <ul>
                    {masterPlanPreview.nextSteps.slice(0, 4).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              </div>
            </section>

            {upgradeSuggestionCard && (
              <section className="continuation-box">
                <div className="upgrade-engine-head">
                  <div>
                    <strong>Onay bekleyen otomasyon önerisi</strong>
                    <p className="hint">
                      Kaynak: {upgradeSuggestionCard.source} • Hedef:{" "}
                      {upgradeSuggestionCard.target}
                    </p>
                  </div>
                  <span className="pill">{upgradeSuggestionCard.target}</span>
                </div>
                <p>
                  <strong>{upgradeSuggestionCard.title}</strong> —{" "}
                  {upgradeSuggestionCard.description}
                </p>
                {upgradeSuggestionCard.sourceUrl && (
                  <p className="hint code-line">{upgradeSuggestionCard.sourceUrl}</p>
                )}
                <div className="actions">
                  <button onClick={() => applySuggestionByRule(upgradeSuggestionCard)}>
                    Uygula (Onaylı)
                  </button>
                  <button className="muted-button" onClick={() => setUpgradeSuggestionCard(null)}>
                    Reddet
                  </button>
                </div>
              </section>
            )}

            {latestAutomationAudit && (
              <p className="hint">
                Son otomasyon: {latestAutomationAudit.source} / {latestAutomationAudit.action} /{" "}
                {latestAutomationAudit.targetType} / {latestAutomationAudit.result}
                {latestAutomationAudit.operationId
                  ? ` / ${latestAutomationAudit.operationId}`
                  : ""}
              </p>
            )}

            {latestEngineDiagnostic && (
              <p className="hint">
                Tanı: {latestEngineDiagnostic.source} / {latestEngineDiagnostic.action} /{" "}
                {latestEngineDiagnostic.result}
                {latestEngineDiagnostic.errorCode
                  ? ` / ${latestEngineDiagnostic.errorCode}`
                  : ""}
                {latestEngineDiagnostic.operationId
                  ? ` / ${latestEngineDiagnostic.operationId}`
                  : ""}
              </p>
            )}
          </section>
        )}

        {page === "chat" && (
          <section className="panel chat">
            <header>
              <div>
                <h2>{chatUiText.title}</h2>
                <p>{chatUiText.subtitle}</p>
              </div>
              <span className="pill">{chatUiText.badge}</span>
            </header>

            {isRestricted && (
              <div className="warning">{chatUiText.restrictedWarning}</div>
            )}

            {isTemporarySession && (
              <div className="warning">
                Geçici profil aktif. Önceki sohbet geçmişi görünmez ve bu oturum ayrı
                tutulur.
              </div>
            )}

            <div className="messages" ref={chatMessagesRef}>
              {visibleChatMessages.map((message, index) => (
                <div key={index} className={`message ${message.role}`}>
                  <div className="message-head">
                    {message.role === "assistant" && (
                      <img
                        className="message-avatar"
                        src={assistantAvatarDataUrl}
                        alt="OC avatar"
                      />
                    )}
                    <b>{message.role === "user" ? "Sen" : "OC"}</b>
                  </div>
                  <p>{message.content}</p>
                </div>
              ))}

              {loading && (
                <div className="message assistant">
                  <div className="message-head">
                    <img
                      className="message-avatar"
                      src={assistantAvatarDataUrl}
                      alt="OC avatar"
                    />
                    <b>OC</b>
                  </div>
                  <p>{chatUiText.thinking}</p>
                </div>
              )}
            </div>

            <div
              className={`chat-upload-zone ${chatDropActive ? "drag-active" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                if (!isRestricted) setChatDropActive(true);
              }}
              onDragLeave={(event) => {
                if (
                  event.currentTarget &&
                  !event.currentTarget.contains(event.relatedTarget as Node)
                ) {
                  setChatDropActive(false);
                }
              }}
              onDrop={async (event) => {
                event.preventDefault();
                const files = Array.from(event.dataTransfer.files || []);
                await addPendingChatUploadFiles(files);
              }}
            >
              <div className="chat-upload-toolbar">
                <div className="chat-plus-wrap">
                  <button
                    className="muted-button chat-plus-button"
                    type="button"
                    disabled={isRestricted}
                    onClick={() => setChatActionMenuOpen((current) => !current)}
                    aria-label="Sohbet aksiyonları"
                  >
                    +
                  </button>

                  {chatActionMenuOpen && (
                    <div className="card-menu chat-plus-menu">
                      <button onClick={openChatAttachmentPicker}>
                        {chatUiText.attach}
                      </button>
                      <button
                        onClick={() => {
                          setChatPanelTab("sessions");
                          setShareLinkCreatorOpen(true);
                          setChatActionMenuOpen(false);
                        }}
                        disabled={!isAdmin}
                      >
                        Sohbet linki oluştur
                      </button>
                    </div>
                  )}
                </div>
                <span className="hint">{chatUiText.dropHint}</span>
              </div>

              <input
                ref={chatUploadInputRef}
                className="hidden-input"
                type="file"
                multiple
                accept="image/*,audio/*,text/*,.txt,.md,.json,.csv,.pdf,.doc,.docx"
                onChange={handleChatUploadSelection}
              />

              <div className="chat-panel-tabs">
                <button
                  className={chatPanelTab === "messages" ? "active" : ""}
                  type="button"
                  onClick={() => setChatPanelTab("messages")}
                >
                  Yazışma
                </button>
                <button
                  className={chatPanelTab === "sessions" ? "active" : ""}
                  type="button"
                  onClick={() => setChatPanelTab("sessions")}
                >
                  Sohbetler
                </button>
              </div>

              {chatPanelTab === "sessions" && shareLinkCreatorOpen && (
                <div className="info-box chat-share-box">
                  <strong>Sohbet linki oluştur</strong>
                  <p className="hint">
                    Kimle ve ne hakkinda gorusulecegini yaz, sonra bota net bir talimat ver.
                  </p>

                  <div className="repo-grid">
                    <label className="field">
                      <span>Kimle paylaşılacak?</span>
                      <input
                        value={shareLinkRecipient}
                        onChange={(event) => setShareLinkRecipient(event.target.value)}
                        placeholder="Orn: Ahmet / Musteri / Ekip lideri"
                      />
                    </label>

                    <label className="field">
                      <span>Ne hakkinda?</span>
                      <input
                        value={shareLinkTopic}
                        onChange={(event) => setShareLinkTopic(event.target.value)}
                        placeholder="Orn: Kisa film cekim plani"
                      />
                    </label>

                    <label className="field field-wide">
                      <span>Bot talimati</span>
                      <textarea
                        value={shareLinkInstruction}
                        onChange={(event) =>
                          setShareLinkInstruction(event.target.value)
                        }
                        placeholder="Örn: Mekan, bütçe, tarih ve oyuncu uygunluğunu netleştir. Konu dışına çıkma."
                      />
                    </label>

                    <label className="field">
                      <span>Maksimum mesaj</span>
                      <input
                        value={shareLinkMaxMessages}
                        onChange={(event) => setShareLinkMaxMessages(event.target.value)}
                        placeholder="12"
                      />
                    </label>

                    <label className="field">
                      <span>Link suresi (saat)</span>
                      <input
                        value={shareLinkExpireHours}
                        onChange={(event) => setShareLinkExpireHours(event.target.value)}
                        placeholder="24"
                      />
                    </label>
                  </div>

                  <div className="actions">
                    <button onClick={createShareChatLink}>Link oluştur</button>
                    <button
                      className="muted-button"
                      onClick={() => {
                        setShareLinkCreatorOpen(false);
                        setShareLinkError("");
                      }}
                    >
                      Iptal
                    </button>
                  </div>
                </div>
              )}

              {chatPanelTab === "messages" && pendingChatUploads.length > 0 && (
                <div className="chat-upload-list">
                  <strong>{chatUiText.uploadReady}</strong>
                  <div className="chat-upload-chips">
                    {pendingChatUploads.map((upload) => (
                      <button
                        key={upload.id}
                        className="chat-upload-chip"
                        type="button"
                        onClick={() => removePendingChatUpload(upload.id)}
                        title={
                          uiLanguage === "en"
                            ? "Remove attachment"
                            : "Eki kaldır"
                        }
                      >
                        {formatChatUploadKind(upload.kind, uiLanguage)} • {upload.fileName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatPanelTab === "sessions" && isAdmin && shareLinkSessions.length > 0 && (
                <div className="info-box chat-share-box">
                  <strong>Sohbet linkleri</strong>
                  <p className="hint">
                    Bu listede oluşturduğun geçici konuşma linkleri görünür.
                  </p>
                  <div className="status-log-list">
                    {shareLinkSessions.slice(0, 8).map((session) => (
                      <div
                        key={session.id}
                        className={`status-log-item ${
                          session.status === "active"
                            ? "success"
                            : session.status === "completed"
                            ? "info"
                            : "warn"
                        }`}
                      >
                        <span className="status-log-text">
                          <strong>{session.topic}</strong> • {session.recipientLabel} •{" "}
                          {session.status}
                          <br />
                          <small>{session.url}</small>
                        </span>
                        <div className="card-actions-inline">
                          <button
                            className="muted-button"
                            onClick={() => copyShareLink(session)}
                          >
                            Kopyala
                          </button>
                          <button
                            className="muted-button"
                            onClick={() => openShareSessionInThisDevice(session)}
                          >
                            Ac
                          </button>
                          <button
                            className="danger-button"
                            onClick={() => revokeShareLink(session.id)}
                            disabled={session.status !== "active"}
                          >
                            Kapat
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {chatPanelTab === "sessions" && (
                <div className="info-box chat-share-box">
                  <strong>Dış görüşmeler</strong>
                  <p className="hint">
                    Sohbet linkleri üzerinden yapılan görüşmeler burada listelenir.
                  </p>
                  {externalConversationList.length === 0 ? (
                    <p className="hint">Henüz dış görüşme kaydı yok.</p>
                  ) : (
                    <div className="status-log-list">
                      {externalConversationList.slice(0, 20).map((item) => (
                        <div key={item.id} className="status-log-item info">
                          <span className="status-log-text">
                            <strong>{item.topic}</strong> • {item.recipientLabel} •{" "}
                            {item.status}
                            <br />
                            <small>
                              Mesaj: {item.messageCount} • Son:{" "}
                              {new Date(
                                item.lastMessageAt || item.completedAt || item.createdAt
                              ).toLocaleString("tr-TR")}
                            </small>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {chatPanelTab === "messages" && chatUploadMessage && (
                <p className="hint">{chatUploadMessage}</p>
              )}
              {shareLinkMessage && <p className="ok-text">{shareLinkMessage}</p>}
              {shareLinkError && <p className="error-text">{shareLinkError}</p>}

              {chatPanelTab === "messages" && (
                <div className="composer">
                <textarea
                  value={input}
                  disabled={isRestricted}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={
                    isRestricted
                      ? chatUiText.placeholderRestricted
                      : chatUiText.placeholderNormal
                  }
                />
                <button
                  onClick={sendMessage}
                  disabled={
                    loading ||
                    isRestricted ||
                    (!input.trim() && pendingChatUploads.length === 0)
                  }
                >
                  {chatUiText.send}
                </button>
                </div>
              )}
            </div>
          </section>
        )}

        {page === "terminal" && isAdmin && (
          <section className="panel">
            <header>
              <div>
                <h2>OC Terminal</h2>
                <p>
                  Uygulama içinden yerel komut çalıştır. Bu alan yalnızca admin
                  için açıktır.
                </p>
              </div>
              <span className="pill">Desktop</span>
            </header>

            <div className="warning">
              Güvenlik notu: Bu terminal prototip aşamasındadır. Komutlar yalnızca
              kendi makinenizde çalışır ve log olarak burada tutulur.
            </div>

            <div className="composer">
              <textarea
                value={terminalInput}
                onChange={(event) => setTerminalInput(event.target.value)}
                placeholder="Örn: ollama list"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    runEmbeddedTerminalCommand();
                  }
                }}
              />
              <button
                onClick={runEmbeddedTerminalCommand}
                disabled={terminalRunning || !terminalInput.trim()}
              >
                {terminalRunning ? "Çalışıyor..." : "Çalıştır"}
              </button>
            </div>

            {terminalError && <p className="error-text">{terminalError}</p>}

            <div className="status-log">
              <div className="status-log-head">
                <strong>Terminal geçmişi</strong>
                <span>{terminalHistory.length} kayıt</span>
              </div>

              {terminalHistory.length === 0 ? (
                <p className="hint">
                  Henüz komut çalıştırılmadı. İlk komutu yazarak başlatabilirsin.
                </p>
              ) : (
                <div className="status-log-list">
                  {terminalHistory.map((entry) => (
                    <div key={entry.id} className="status-log-item info">
                      <span className="status-log-time">
                        {new Date(entry.at).toLocaleString("tr-TR")}
                      </span>
                      <span className="status-log-text">
                        <strong>{entry.command}</strong> (çıkış kodu: {entry.statusCode})
                      </span>
                      {entry.stdout && (
                        <pre className="terminal-output">{entry.stdout}</pre>
                      )}
                      {entry.stderr && (
                        <pre className="terminal-output error">{entry.stderr}</pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {page === "hub" && hubTab === "capabilities" && (
          <section className="panel">
            <header>
              <div>
                <h2>Yetenekler</h2>
                <p>OC çekirdeğinin doğuştan gelen yetenekleri.</p>
              </div>
              <span className="pill">
                Core Registry ({activeCapabilities.length}/{mergedCapabilities.length})
              </span>
            </header>

            <p className="hint">
              Kartları soldaki tutacakla sürükleyip bırakarak öncelik sırasını
              değiştir. Üstte kalan kartlar daha öncelikli kabul edilir.
            </p>

            <div className="info-box capability-builder">
              <strong>Kendi yetenek başlığını ekle</strong>
              <p className="hint">
                Buraya eklenen başlıklar yerel listeye kaydolur ve yetenekler
                ekranında görünür.
              </p>

              <div className="warning">
                İstersen önce LLM ile taslak üret, sonra biçimi elle düzeltip
                ekle. Bu akış model destekli eklemeyi canlı tutar.
              </div>

              <div className="capability-form">
                <label className="field field-wide">
                  <span>Yetenek fikri</span>
                  <textarea
                    value={capabilityIdea}
                    onChange={(event) => setCapabilityIdea(event.target.value)}
                    placeholder="Örn: metinden kısa marka dili çıkar, video kurgusuna uygun ton öner, içerik üretim hızını artır"
                  />
                </label>
              </div>

              <div className="actions">
                <button
                  onClick={generateCapabilityDraftFromModel}
                  disabled={capabilityDraftLoading || isRestricted}
                >
                  {capabilityDraftLoading
                    ? "Taslak üretiliyor..."
                    : "LLM ile taslak üret"}
                </button>
                <button
                  className="muted-button"
                  onClick={() => {
                    setCapabilityIdea("");
                    setCapabilityDraftMessage("");
                    setCapabilityDraftError("");
                  }}
                >
                  Model alanını temizle
                </button>
              </div>

              {capabilityDraftMessage && (
                <p className="ok-text">{capabilityDraftMessage}</p>
              )}
              {capabilityDraftError && (
                <p className="error-text">{capabilityDraftError}</p>
              )}

              <div className="capability-form">
                <label className="field">
                  <span>Yetenek başlığı</span>
                  <input
                    value={customCapabilityName}
                    onChange={(event) =>
                      setCustomCapabilityName(event.target.value)
                    }
                    placeholder="Örn: Kod inceleme, Veri temizleme, Prompt laboratuvarı"
                  />
                </label>

                <label className="field field-wide">
                  <span>Açıklama</span>
                  <textarea
                    value={customCapabilityDescription}
                    onChange={(event) =>
                      setCustomCapabilityDescription(event.target.value)
                    }
                    placeholder="Bu yetenek ne işe yarar?"
                  />
                </label>
              </div>

              <div className="actions">
                <button onClick={addCustomCapability}>Yetenek ekle</button>
              </div>

              {customCapabilityMessage && (
                <p className="ok-text">{customCapabilityMessage}</p>
              )}
              {customCapabilityError && (
                <p className="error-text">{customCapabilityError}</p>
              )}
            </div>

            {capabilityActionMessage && (
              <p className="ok-text">{capabilityActionMessage}</p>
            )}
            {capabilityActionError && (
              <p className="error-text">{capabilityActionError}</p>
            )}

            {capabilityDevelopment && (
              <div className="warning">
                Yetenek geliştirme açık. OC, listelenen yetenek konularını
                inceleyip eksik alt beceriler, paket fikirleri ve geliştirme
                önerileri üretecek.
              </div>
            )}

            {capabilityResearchTarget && (
              <div className="research-box">
                <div className="research-head">
                  <div>
                    <strong>Geliştirme araştırması</strong>
                    <p className="hint">
                      {capabilityResearchTarget.name} için internet kaynakları,
                      kütüphane önerileri ve doküman aramaları.
                    </p>
                  </div>
                  <button
                    className="muted-button"
                    onClick={() => setCapabilityResearchTargetId(null)}
                  >
                    Kapat
                  </button>
                </div>

                <div className="research-grid">
                  {capabilityResearchLinks.map((item) => (
                    <article className="research-card" key={item.url}>
                      <strong>{item.label}</strong>
                      <p>{item.description}</p>
                      <div className="card-actions-inline">
                        <button
                          onClick={() =>
                            openCapabilityResearchUrl(
                              item.url,
                              item.label,
                              "capability"
                            )
                          }
                        >
                          Aç
                        </button>
                        <button
                          className="muted-button"
                          onClick={() =>
                            autoApplySuggestion(
                              item.label,
                              item.description,
                              item.url,
                              "capability",
                              "capability"
                            )
                          }
                        >
                          Yükselt
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                {openedSourcePreviews.length > 0 && (
                  <div className="info-box">
                    <strong>Açılan kaynaklar</strong>
                    <p className="hint">
                      "Kaynağı aç" işlemleri burada izlenir. Her kayıt işlem kimliği
                      ile otomasyon akışına bağlanır.
                    </p>
                    <div className="status-log-list">
                      {openedSourcePreviews.slice(0, 6).map((item) => (
                        <div key={item.id} className="status-log-item info">
                          <span className="status-log-text">
                            [{item.operationId}] <strong>{item.title}</strong> •{" "}
                            {item.source} • {item.status}
                            <br />
                            <small>{item.url}</small>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pendingLibrarySuggestionsForTarget.length > 0 && (
                  <>
                    <div className="section-separator">
                      <strong>Onay bekleyen kütüphane önerileri</strong>
                      <span>{pendingLibrarySuggestionsForTarget.length} adet</span>
                    </div>
                    <div className="cards">
                      {pendingLibrarySuggestionsForTarget.map((item) => (
                        <article className="card" key={item.id}>
                          <div className="card-top">
                            <h3>{item.libraryName}</h3>
                            <span className="badge planned">{item.ecosystem}</span>
                          </div>
                          <p>{item.reason}</p>
                          <small>{item.capabilityName}</small>
                          <div className="card-actions-inline">
                            <button
                              className="muted-button"
                              onClick={() =>
                                openCapabilityResearchUrl(
                                  item.sourceUrl,
                                  item.libraryName,
                                  "capability"
                                )
                              }
                            >
                              Kaynağı aç
                            </button>
                            <button onClick={() => approveLibrarySuggestion(item.id)}>
                              Havuza ekle (Onay)
                            </button>
                            {item.ecosystem === "github" && (
                              <button
                                className="muted-button"
                                onClick={() => pullLibrarySuggestionFromGithub(item.id)}
                              >
                                GitHub'dan cek
                              </button>
                            )}
                            <button
                              className="danger-button"
                              onClick={() => rejectLibrarySuggestion(item.id)}
                            >
                              Reddet
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="info-box">
              <strong>Kütüphane havuzu</strong>
              <p className="hint">
                Onaylanan öneriler bu listede kalır ve yetenek geliştirme akışında yeniden kullanılabilir.
              </p>
              {capabilityLibraryPool.length === 0 ? (
                <p className="hint">Henüz onaylanmış kütüphane yok.</p>
              ) : (
                <div className="chip-row">
                  {capabilityLibraryPool.slice(0, 18).map((item) => (
                    <span className="chip" key={item.id}>
                      {item.libraryName} ({item.ecosystem})
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="cards capability-cards">
              {activeCapabilities.map((capability) =>
                renderCapabilityCard(capability)
              )}
            </div>

            {pausedCapabilities.length > 0 && (
              <>
                <div className="section-separator">
                  <strong>Pasif Yetenekler</strong>
                  <span>{pausedCapabilities.length} adet</span>
                </div>
                <div className="cards capability-cards">
                  {pausedCapabilities.map((capability) =>
                    renderCapabilityCard(capability)
                  )}
                </div>
              </>
            )}

            {archivedCapabilities.length > 0 && (
              <>
                <div className="section-separator">
                  <strong>Arşivlenen Yetenekler</strong>
                  <span>{archivedCapabilities.length} adet</span>
                </div>
                <div className="cards capability-cards">
                  {archivedCapabilities.map((capability) =>
                    renderCapabilityCard(capability)
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {page === "hub" && hubTab === "packs" && (
          <section className="panel">
            <header>
              <div>
                <h2>Paketler</h2>
                <p>
                  .corepack dosyaları rol, persona, yetenek, uzmanlık veya iş
                  akışı ekleyebilir.
                </p>
              </div>
              <span className="pill">.corepack</span>
            </header>

            <div className="actions">
              <button
                onClick={() =>
                  document.getElementById("corepack-input")?.click()
                }
              >
                Dosyadan paket yükle
              </button>
              <button onClick={() => openHubTab("repository")}>
                GitHub / GitLab'dan çek
              </button>
              <button
                onClick={() => {
                  runUpgradeEngine();
                  setHubTab("upgrades");
                  setUpgradeEngineMessage(
                    "Paket güncellemeleri kontrol edildi. Geçiş: Yükseltmeler sekmesi."
                  );
                }}
              >
                Güncellemeleri kontrol et
              </button>
            </div>

            <div className="info-box capability-builder">
              <strong>Kendi paketini ekle</strong>
              <p className="hint">
                Buraya eklenen paketler yerelde saklanır, aktif edilebilir ve chat
                sırasında system prompt katmanına girer.
              </p>

              <div className="warning">
                Paket fikrini LLM’e verip taslağı otomatik üretebilirsin. Sonra
                adı, promptu ve türü istersen elle düzenle.
              </div>

              <div className="capability-form">
                <label className="field field-wide">
                  <span>Paket fikri</span>
                  <textarea
                    value={packIdea}
                    onChange={(event) => setPackIdea(event.target.value)}
                    placeholder="Örn: öğretmen persona paketi, video kurgu workflow paketi, bilimsel araştırma destek paketi"
                  />
                </label>
              </div>

              <div className="actions">
                <button
                  onClick={generatePackDraftFromModel}
                  disabled={packDraftLoading || isRestricted}
                >
                  {packDraftLoading ? "Taslak üretiliyor..." : "LLM ile taslak üret"}
                </button>
                <button
                  className="muted-button"
                  onClick={() => {
                    setPackIdea("");
                    setPackDraftMessage("");
                    setPackDraftError("");
                  }}
                >
                  Model alanını temizle
                </button>
              </div>

              {packDraftMessage && <p className="ok-text">{packDraftMessage}</p>}
              {packDraftError && <p className="error-text">{packDraftError}</p>}

              <div className="capability-form">
                <label className="field">
                  <span>Paket adı</span>
                  <input
                    value={customPackName}
                    onChange={(event) => setCustomPackName(event.target.value)}
                    placeholder="Örn: teacher.corepack"
                  />
                </label>

                <label className="field">
                  <span>Paket türü</span>
                  <input
                    value={customPackType}
                    onChange={(event) => setCustomPackType(event.target.value)}
                    placeholder="Örn: Role, Persona, Workflow"
                  />
                </label>

                <label className="field field-wide">
                  <span>Açıklama</span>
                  <textarea
                    value={customPackDescription}
                    onChange={(event) =>
                      setCustomPackDescription(event.target.value)
                    }
                    placeholder="Bu paket ne işe yarar?"
                  />
                </label>

                <label className="field field-wide">
                  <span>Prompt</span>
                  <textarea
                    value={customPackPrompt}
                    onChange={(event) => setCustomPackPrompt(event.target.value)}
                    placeholder="Pakete ait system prompt içeriği"
                  />
                </label>
              </div>

              <div className="actions">
                <button onClick={addCustomPack}>Paket ekle</button>
                <button
                  className="muted-button"
                  onClick={() => {
                    setCustomPackName("");
                    setCustomPackType("");
                    setCustomPackDescription("");
                    setCustomPackPrompt("");
                    setCustomPackMessage("");
                    setCustomPackError("");
                  }}
                >
                  Alanları temizle
                </button>
              </div>

              {customPackMessage && <p className="ok-text">{customPackMessage}</p>}
              {customPackError && <p className="error-text">{customPackError}</p>}
            </div>

            <input
              id="corepack-input"
              type="file"
              accept=".corepack,.zip,application/zip"
              className="hidden-input"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void importCorePackFileValidated(file);
                }
                event.currentTarget.value = "";
              }}
            />

            <div className="info-box">
              <strong>Aktif paket: {activePack ? activePack.name : "Yok"}</strong>
              <p className="hint">
                Aktif paket, chat sırasında system prompt davranışını etkiler.
              </p>
              {packLoadStatus && <p className="ok-text">{packLoadStatus}</p>}
              {packLoadError && <p className="error-text">{packLoadError}</p>}
              {activePack && (
                <div className="actions">
                  <button onClick={() => setActivePackId("")}>
                    Aktif paketi kapat
                  </button>
                </div>
              )}
            </div>

            <div className="info-box capability-builder">
              <strong>Dahili kendini geliştirme modülü</strong>
              <p className="hint">
                Akış: Kaynak tara -&gt; Öneri üret -&gt; Uygula (Onaylı).
              </p>
              <div className="actions">
                <button onClick={scanPackSelfDevelopmentSources}>Kaynak Tara</button>
                <button className="muted-button" onClick={generatePackSelfDevelopmentTasks}>
                  Öneri Üret
                </button>
              </div>
              {packSelfScanMessage && <p className="hint">{packSelfScanMessage}</p>}
              {packSelfDevMessage && <p className="ok-text">{packSelfDevMessage}</p>}
              {packSelfDevError && <p className="error-text">{packSelfDevError}</p>}

              {packSelfDevTasks.length > 0 && (
                <div className="cards">
                  {packSelfDevTasks.slice(0, 6).map((task) => (
                    <article className="card" key={task.id}>
                      <div className="card-top">
                        <h3>{task.title}</h3>
                        <span className={`badge ${task.status === "applied" ? "active" : "planned"}`}>
                          {task.status === "applied" ? "Uygulandı" : "Taslak"}
                        </span>
                      </div>
                      <p>{task.summary}</p>
                      <small>Hedef: {task.suggestion.target}</small>
                      <div className="card-actions-inline">
                        <button
                          className={task.status === "applied" ? "muted-button" : ""}
                          disabled={task.status === "applied"}
                          onClick={() => runPackSelfDevelopment(task.id)}
                        >
                          Uygula (Onaylı)
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="cards">
              {allPackProfiles.map((pack) => {
                const isActivePack = activePackId === pack.id;

                return (
                  <article className="card" key={pack.id}>
                    <div>
                      <div className="card-top">
                        <h3>{pack.name}</h3>
                        <span className={`badge ${isActivePack ? "active" : "ready"}`}>
                          {isActivePack ? "Aktif" : "Hazır"}
                        </span>
                      </div>
                      <p>{pack.description}</p>
                    </div>
                    <div className="card-actions">
                      <small>
                        {pack.type}
                        {pack.source === "imported"
                          ? " • imported"
                          : pack.source === "custom"
                          ? " • custom"
                          : " • core"}
                      </small>
                      <div className="card-actions-inline">
                        <button
                          className={isActivePack ? "muted-button" : ""}
                          onClick={() => setActivePackId(pack.id)}
                        >
                          {isActivePack ? "Aktif" : "Aktif et"}
                        </button>
                        <button
                          className="muted-button"
                          onClick={() =>
                            autoApplySuggestion(
                              `${pack.name} geliştirme`,
                              pack.description,
                              undefined,
                              "pack",
                              "pack"
                            )
                          }
                        >
                          Yükselt
                        </button>
                        {pack.source !== "bundled" && (
                          <button
                            className="danger-button"
                            onClick={() =>
                              pack.source === "imported"
                                ? removeImportedPack(pack.id)
                                : removeCustomPack(pack.id)
                            }
                          >
                            Kaldır
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="cards">
              {plannedPacks.map((pack) => (
                <article className="card" key={pack.name}>
                  <div>
                    <div className="card-top">
                      <h3>{pack.name}</h3>
                      <span className="badge planned">{pack.type}</span>
                    </div>
                    <p>{pack.description}</p>
                  </div>
                  <small>Planlanan modül kategorisi</small>
                  <div className="card-actions-inline">
                    <button
                      className="muted-button"
                      onClick={() =>
                        autoApplySuggestion(
                          pack.name,
                          pack.description,
                          undefined,
                          "pack",
                          "pack"
                        )
                      }
                    >
                      Yükselt
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {page === "hub" && hubTab === "repository" && (
          <section className="panel">
            <header>
              <div>
                <h2>Depo Bağlantısı</h2>
                <p>
                  GitHub ve GitLab'dan public dosya çek. Geliştirme için hızlı
                  ön izleme akışı.
                </p>
              </div>
              <span className="pill">Repository Connector</span>
            </header>

            <div className="warning">
              Bu ekran şimdilik public raw dosya ön izlemesi sağlar. Auth tabanlı
              tam repo entegrasyonu roadmap'te genişletilecek.
            </div>

            <div className="repo-grid">
              <label className="field">
                <span>Kaynak</span>
                <select
                  value={repoSource}
                  onChange={(event) =>
                    setRepoSource(event.target.value as RepositorySource)
                  }
                >
                  <option value="github">GitHub</option>
                  <option value="gitlab">GitLab</option>
                </select>
              </label>

              <label className="field">
                <span>Repo URL</span>
                <input
                  value={repoUrl}
                  onChange={(event) => setRepoUrl(event.target.value)}
                  placeholder={
                    repoSource === "github"
                      ? "https://github.com/owner/repo"
                      : "https://gitlab.com/owner/repo"
                  }
                />
              </label>

              <label className="field">
                <span>Branch / ref</span>
                <input
                  value={repoRef}
                  onChange={(event) => setRepoRef(event.target.value)}
                  placeholder="main"
                />
              </label>

              <label className="field field-wide">
                <span>Dosya yolu</span>
                <input
                  value={repoPath}
                  onChange={(event) => setRepoPath(event.target.value)}
                  placeholder="src/App.tsx"
                />
              </label>
            </div>

            <div className="actions">
              <button onClick={fetchRepositoryFile}>Dosyayı çek</button>
              <button className="muted-button" onClick={queueRepositorySuggestion}>
                Öneriye dönüştür
              </button>
              <button onClick={() => openHubTab("packs")}>Paketler'e dön</button>
            </div>

            {repoFetchStatus && <p className="ok-text">{repoFetchStatus}</p>}
            {repoFetchError && <p className="error-text">{repoFetchError}</p>}
            {repoSuggestionMessage && <p className="hint">{repoSuggestionMessage}</p>}

            {repoFetchedUrl && (
              <div className="info-box">
                <strong>Çekilen adres</strong>
                <p className="hint code-line">{repoFetchedUrl}</p>
              </div>
            )}

            {repoFileContent && (
              <div className="repo-preview">
                <strong>Dosya ön izlemesi</strong>
                <pre>{repoFileContent}</pre>
              </div>
            )}
          </section>
        )}

        {page === "hub" && hubTab === "coding" && (
          <section className="panel">
            <header>
              <div>
                <h2>Kodlama</h2>
                <p>
                  Kodlama işleri için ayrı bir model seç, sonra GitHub'da ilgili
                  kütüphaneleri ve örnek projeleri ara.
                </p>
              </div>
              <span className="pill">Code Search Hub</span>
            </header>

            <div className="warning">
              Kodlama için genel sohbet modelinden ayrı bir model seçmek işleri
              daha tutarlı hale getirir. Önerilen adaylar: <code>qwen2.5-coder:7b</code>,
              <code>deepseek-coder:6.7b</code>, <code>codellama:7b</code>.
            </div>

            <div className="model-box">
              <label className="field">
                <span>Kodlama modeli</span>
                <input
                  value={codingModel}
                  onChange={(event) => setCodingModel(event.target.value)}
                  placeholder="qwen2.5-coder:7b"
                />
              </label>

              <button onClick={() => applyModelSelection(codingModel, "kodlama modeli")}>
                Kodlama modelini ana modele geçir
              </button>
            </div>

            <div className="actions">
              {["qwen2.5-coder:7b", "deepseek-coder:6.7b", "codellama:7b"].map(
                (item) => (
                  <button key={item} onClick={() => setCodingModel(item)}>
                    {item}
                  </button>
                )
              )}
            </div>

            <div className="info-box">
              <strong>GitHub arama sorgusu</strong>
              <p className="hint">
                Doğrudan repository araması açılır. İstersen sorguyu düzenle,
                istersen önerilen kartlardan birini seç.
              </p>

              <div className="model-box">
                <label className="field field-wide">
                  <span>Arama metni</span>
                  <input
                    value={codingSearch}
                    onChange={(event) => setCodingSearch(event.target.value)}
                    placeholder="tauri plugin dialog fs shell"
                  />
                </label>

                <button onClick={() => openGithubCodeSearch(codingSearch)}>
                  GitHub'da ara
                </button>
                <button onClick={() => copyCodingSearchQuery(codingSearch)}>
                  Sorguyu kopyala
                </button>
              </div>

              {codingMessage && <p className="ok-text">{codingMessage}</p>}
              <p className="hint code-line">
                https://github.com/search?q=
                {encodeURIComponent(codingSearch)}&type=repositories
              </p>
            </div>

            <div className="coding-chat-box">
              <div className="upgrade-engine-head">
                <div>
                  <strong>Kodlama sohbeti</strong>
                  <p className="hint">
                    Burada ayrı kodlama modeliyle teknik soru sor, ardından arama
                    akışını aynı yerde devam ettir.
                  </p>
                </div>
                <span className="pill">{codingModel}</span>
              </div>

              <div className="messages coding-messages">
                {codingMessages.map((message, index) => (
                  <div key={index} className={`message ${message.role}`}>
                    <div className="message-head">
                      {message.role === "assistant" && (
                        <img
                          className="message-avatar"
                          src={assistantAvatarDataUrl}
                          alt="OC avatar"
                        />
                      )}
                      <b>{message.role === "user" ? "Sen" : "OC"}</b>
                    </div>
                    <p>{message.content}</p>
                  </div>
                ))}

                {codingLoading && (
                  <div className="message assistant">
                    <div className="message-head">
                      <img
                        className="message-avatar"
                        src={assistantAvatarDataUrl}
                        alt="OC avatar"
                      />
                      <b>OC</b>
                    </div>
                    <p>Çözüm üretiyorum...</p>
                  </div>
                )}
              </div>

              <div className="composer">
                <textarea
                  value={codingInput}
                  disabled={isRestricted}
                  onChange={(event) => setCodingInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendCodingMessage();
                    }
                  }}
                  placeholder={
                    isRestricted
                      ? "Kodlama sohbeti için geçerli lisans gerekiyor..."
                      : "Kodlama için soru sor..."
                  }
                />
                <button onClick={sendCodingMessage} disabled={codingLoading || isRestricted}>
                  Gönder
                </button>
              </div>
            </div>

            <div className="coding-grid">
              {codingSearchSuggestions.map((item) => (
                <article className="coding-card" key={item.id}>
                  <div className="card-top">
                    <h3>{item.title}</h3>
                    <span className="badge planned">Öneri</span>
                  </div>
                  <p>{item.summary}</p>
                  <div className="chip-row">
                    {item.hints.map((hint) => (
                      <span className="chip" key={hint}>
                        {hint}
                      </span>
                    ))}
                  </div>
                    <div className="card-actions-inline">
                      <button onClick={() => openGithubCodeSearch(item.query)}>
                        GitHub'da ara
                      </button>
                      <button
                        className="muted-button"
                        onClick={() => {
                          setCodingSearch(item.query);
                          setCodingMessage("Önerilen sorgu hazırlandı.");
                        }}
                      >
                        Sorguyu hazırla
                      </button>
                      <button
                        className="muted-button"
                        onClick={() =>
                          autoApplySuggestion(
                            item.title,
                            item.summary,
                            undefined,
                            undefined,
                            "coding"
                          )
                        }
                      >
                        Yükselt
                      </button>
                    </div>
                  </article>
                ))}
              </div>
          </section>
        )}

        {page === "hub" && hubTab === "browser" && (
          <section className="panel">
            <header>
              <div>
                <h2>Tarayıcı</h2>
                <p>
                  Gömülü web paneli. İndirmeler doğrudan başlamaz; her dosya için
                  önce açık onay alınır.
                </p>
              </div>
              <span className="pill">Controlled Browser</span>
            </header>

            <div className="warning">
              Güvenli indirme modu aktif. Bir indirme bağlantısı algılandığında
              önce onay kartı oluşur; onay verilmeden ağ/klasör yazımı başlatılmaz.
            </div>

            <div className="browser-toolbar">
              <div className="browser-toolbar-row">
                <button
                  className="muted-button"
                  onClick={browserGoBack}
                  disabled={!activeBrowserTab || activeBrowserTab.historyIndex <= 0}
                >
                  Geri
                </button>
                <button
                  className="muted-button"
                  onClick={browserGoForward}
                  disabled={
                    !activeBrowserTab ||
                    activeBrowserTab.historyIndex >= activeBrowserTab.history.length - 1
                  }
                >
                  İleri
                </button>
                <button className="muted-button" onClick={browserReload}>
                  Yenile
                </button>
                <button className="muted-button" onClick={browserStop}>
                  Durdur
                </button>
                <button onClick={() => openBrowserTab()}>Yeni sekme</button>
                <button className="muted-button" onClick={toggleBrowserFavorite}>
                  {currentBrowserFavorite ? "Favoriden çıkar" : "Favoriye ekle"}
                </button>
              </div>

              <div className="browser-toolbar-row">
                <label className="field browser-address-field">
                  <span>Adres</span>
                  <input
                    value={browserAddressInput}
                    onChange={(event) => setBrowserAddressInput(event.target.value)}
                    placeholder="https://..."
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        navigateBrowser();
                      }
                    }}
                  />
                </label>
                <button onClick={navigateBrowser}>Git</button>
                <button
                  className="muted-button"
                  onClick={() => void queueDownloadApproval(browserAddressInput)}
                >
                  Bağlantıdan indir
                </button>
              </div>

              <div className="browser-tabs-row">
                {browserTabs.map((tab) => (
                  <div
                    key={tab.id}
                    className={`browser-tab-pill ${tab.id === activeBrowserTabId ? "active" : ""}`}
                  >
                    <button
                      className="browser-tab-main"
                      onClick={() => {
                        setActiveBrowserTabId(tab.id);
                        setBrowserAddressInput(tab.url);
                        setBrowserError("");
                      }}
                    >
                      {tab.loading ? "• " : ""}
                      {tab.title}
                    </button>
                    <button
                      className="browser-tab-mini"
                      onClick={() => {
                        setBrowserRenameTabId(tab.id);
                        setBrowserRenameValue(tab.title);
                      }}
                      title="Sekmeyi yeniden adlandır"
                    >
                      ✎
                    </button>
                    <button
                      className="browser-tab-mini"
                      onClick={() => closeBrowserTab(tab.id)}
                      title="Sekmeyi kapat"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {browserRenameTabId && (
                <div className="browser-rename-row">
                  <label className="field browser-address-field">
                    <span>Sekme başlığı</span>
                    <input
                      value={browserRenameValue}
                      onChange={(event) => setBrowserRenameValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && browserRenameTabId) {
                          event.preventDefault();
                          renameBrowserTab(browserRenameTabId, browserRenameValue);
                        }
                      }}
                    />
                  </label>
                  <button
                    onClick={() =>
                      renameBrowserTab(browserRenameTabId, browserRenameValue)
                    }
                  >
                    Kaydet
                  </button>
                  <button
                    className="muted-button"
                    onClick={() => {
                      setBrowserRenameTabId(null);
                      setBrowserRenameValue("");
                    }}
                  >
                    Vazgeç
                  </button>
                </div>
              )}

              {browserStatusMessage && <p className="ok-text">{browserStatusMessage}</p>}
              {browserError && <p className="error-text">{browserError}</p>}
            </div>

            <div className="browser-frame-wrap">
              <iframe
                ref={browserFrameRef}
                key={
                  activeBrowserTab
                    ? `${activeBrowserTab.id}-${activeBrowserTab.reloadToken}`
                    : "browser-empty"
                }
                className="browser-frame"
                title={activeBrowserTab?.title || "OC browser"}
                src={activeBrowserTab?.url || "about:blank"}
                sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                onLoad={() => {
                  if (!activeBrowserTab) return;
                  let nextTitle = resolveBrowserTabTitle(activeBrowserTab.url);
                  try {
                    const maybeTitle =
                      browserFrameRef.current?.contentDocument?.title?.trim() || "";
                    if (maybeTitle) {
                      nextTitle = maybeTitle;
                    }
                  } catch {
                    // Cross-origin erişimde title okunmayabilir.
                  }
                  updateBrowserTab(activeBrowserTab.id, (tab) => ({
                    ...tab,
                    title: nextTitle,
                    loading: false,
                    lastVisitedAt: new Date().toISOString(),
                  }));
                  setBrowserStatusMessage(`Yüklendi: ${nextTitle}`);
                }}
              />
            </div>

            <div className="browser-meta-grid">
              <article className="info-box">
                <strong>Favoriler</strong>
                <p className="hint">Sabit kaynakları tek tıkla tekrar aç.</p>
                {browserFavorites.length === 0 ? (
                  <p className="hint">Henüz favori yok.</p>
                ) : (
                  <div className="status-log-list">
                    {browserFavorites.slice(0, 14).map((item) => (
                      <div key={item.id} className="status-log-item info">
                        <span className="status-log-text">
                          <strong>{item.title}</strong>
                          <br />
                          <small>{item.url}</small>
                        </span>
                        <div className="card-actions-inline">
                          <button
                            className="muted-button"
                            onClick={() => navigateBrowserToUrl(item.url)}
                          >
                            Aç
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="info-box">
                <strong>Gezinme geçmişi</strong>
                <p className="hint">
                  Kayıtlar aratılabilir ve tek tıkla aynı sekmede yeniden açılır.
                </p>
                <label className="field browser-address-field">
                  <span>Ara</span>
                  <input
                    value={browserHistorySearch}
                    onChange={(event) => setBrowserHistorySearch(event.target.value)}
                    placeholder="domain, başlık veya URL..."
                  />
                </label>
                {filteredBrowserHistory.length === 0 ? (
                  <p className="hint">Filtreye uygun geçmiş kaydı yok.</p>
                ) : (
                  <div className="status-log-list">
                    {filteredBrowserHistory.slice(0, 20).map((item) => (
                      <div key={item.id} className="status-log-item info">
                        <span className="status-log-text">
                          <strong>{item.title}</strong>
                          <br />
                          <small>{item.url}</small>
                        </span>
                        <div className="card-actions-inline">
                          <button
                            className="muted-button"
                            onClick={() => openBrowserHistoryEntry(item)}
                          >
                            Aç
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </div>

            <div className="info-box">
              <strong>İndirme kuyruğu (onay bekleyenler)</strong>
              <p className="hint">
                Her indirme isteği önce bu kuyrukta görünür. Onay modalı olmadan
                dosya indirilmez.
              </p>
              {downloadQueue.length === 0 ? (
                <p className="hint">Henüz indirme isteği yok.</p>
              ) : (
                <div className="status-log-list">
                  {downloadQueue.slice(0, 20).map((item) => (
                    <div key={item.id} className="status-log-item warn">
                      <span className="status-log-text">
                        <strong>{item.fileName}</strong> • {item.sourceDomain} • {item.status}
                        <br />
                        <small>{item.url}</small>
                      </span>
                      {item.status === "pending" && (
                        <div className="card-actions-inline">
                          <button
                            onClick={() => {
                              setDownloadDecision({
                                requestId: item.id,
                                approved: false,
                                targetPath: item.suggestedPath,
                              });
                              setDownloadTargetPath(item.suggestedPath);
                              setDownloadModalOpen(true);
                              setDownloadApprovalError("");
                            }}
                          >
                            Onay akışını aç
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="info-box">
              <strong>İndirme audit</strong>
              <p className="hint">
                Kayıt formatı: kaynak, aksiyon sonucu, hedef yol ve not.
              </p>
              {downloadAudit.length === 0 ? (
                <p className="hint">Henüz audit kaydı yok.</p>
              ) : (
                <div className="status-log-list">
                  {downloadAudit.slice(0, 18).map((item) => (
                    <div key={item.id} className="status-log-item info">
                      <span className="status-log-time">
                        {new Date(item.at).toLocaleString("tr-TR")}
                      </span>
                      <span className="status-log-text">
                        <strong>{item.fileName}</strong> • {item.result}
                        <br />
                        <small>{item.targetPath}</small>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {downloadModalOpen && pendingDownloadRequest && (
              <div className="download-modal-backdrop" role="dialog" aria-modal="true">
                <div className="download-modal">
                  <h3>İndirme onayı</h3>
                  <p className="hint">
                    Kaynak: <strong>{pendingDownloadRequest.sourceDomain}</strong>
                  </p>
                  <p className="hint code-line">{pendingDownloadRequest.url}</p>

                  <label className="field field-wide">
                    <span>Hedef dosya yolu</span>
                    <input
                      value={downloadTargetPath}
                      onChange={(event) => setDownloadTargetPath(event.target.value)}
                      placeholder={pendingDownloadRequest.suggestedPath}
                    />
                  </label>

                  {downloadApprovalError && (
                    <p className="error-text">{downloadApprovalError}</p>
                  )}

                  <div className="actions">
                    <button
                      onClick={() => void submitDownloadDecision(true)}
                      disabled={downloadProcessing}
                    >
                      {downloadProcessing ? "İndiriliyor..." : "Onayla ve indir"}
                    </button>
                    <button
                      className="danger-button"
                      onClick={() => void submitDownloadDecision(false)}
                      disabled={downloadProcessing}
                    >
                      Reddet
                    </button>
                    <button
                      className="muted-button"
                      onClick={() => {
                        if (downloadProcessing) return;
                        setDownloadModalOpen(false);
                        setDownloadDecision(null);
                        setDownloadTargetPath("");
                        setDownloadApprovalError("");
                      }}
                    >
                      Kapat
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {page === "persona" && (
          <section className="panel">
            <header>
              <div>
                <h2>Persona</h2>
                <p>
                  Master kullanıcının üretim diline göre OC karakterini
                  şekillendir, avatarı güncelle ve kişisel tonu sisteme işle.
                </p>
              </div>
              <div className="header-actions">
                <span className="pill">Persona Studio</span>
                <button
                  className="muted-button close-button"
                  onClick={() => openHubTab("capabilities")}
                >
                  Kapat
                </button>
              </div>
            </header>

            <div className="warning">
              OC burada iki şeyi ayrı tutar: Master persona'nın bilgisi ve
              kendi eklediği karakter katmanı. Böylece hem kullanıcının dili
              korunur hem de yardımcı karakter açıkça görünür olur.
            </div>

            <div className="persona-layout">
              <article className="persona-avatar-card">
                <div className="persona-avatar-frame">
                  <img
                    src={personaProfile.avatarDataUrl}
                    alt={`${personaProfile.name} avatarı`}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = createPersonaAvatarDataUrl(
                        personaProfile.name,
                        personaProfile.headline
                      );
                    }}
                  />
                </div>
                <div className="persona-avatar-meta">
                  <strong>{personaProfile.name}</strong>
                  <p>{personaProfile.headline}</p>
                </div>
                <div className="chip-row">
                  {personaProfile.traits.map((trait) => (
                    <span className="chip" key={trait}>
                      {trait}
                    </span>
                  ))}
                </div>
                <input
                  ref={assistantAvatarInputRef}
                  className="hidden-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAssistantAvatarUpload}
                />
                <div className="card-actions-inline persona-avatar-actions">
                  <button
                    onClick={() => assistantAvatarInputRef.current?.click()}
                  >
                    Görsel yükle
                  </button>
                  <button className="muted-button" onClick={resetAssistantAvatar}>
                    Varsayılanı kullan
                  </button>
                </div>
                <p className="hint">
                  Buradan yüklenen görsel, tüm kullanıcılar için sohbette OC
                  profil avatarı olarak kullanılır.
                </p>
              </article>

              <div className="persona-editor">
                <div className="repo-grid">
                  <label className="field">
                    <span>Master adı</span>
                    <input
                      value={masterPersonaName}
                      onChange={(event) => setMasterPersonaName(event.target.value)}
                      placeholder="Koray Taşan"
                    />
                  </label>

                  <label className="field">
                    <span>Persona başlığı</span>
                    <input
                      value={masterPersonaHeadline}
                      onChange={(event) =>
                        setMasterPersonaHeadline(event.target.value)
                      }
                      placeholder="Görüntünün, Hikâyenin ve Yeni Nesil Yapay Zekâ Üretiminin Peşinde"
                    />
                  </label>

                  <label className="field field-wide">
                    <span>Persona metni</span>
                    <textarea
                      value={masterPersonaBio}
                      onChange={(event) => setMasterPersonaBio(event.target.value)}
                      placeholder="Koray Taşan'ın anlatı ve üretim dili..."
                    />
                  </label>
                </div>

                <section className="language-identity-box">
                  <div className="upgrade-engine-head">
                    <div>
                      <strong>OC Dil Kimliği</strong>
                      <p className="hint">
                        Bu profil, yerel LLM'in cevap üslubunu özgünleştirir ve
                        system prompt'a eklenir.
                      </p>
                    </div>
                    <span className="pill">Language DNA</span>
                  </div>

                  <div className="repo-grid">
                    <label className="field field-wide">
                      <span>İmza</span>
                      <textarea
                        value={languageIdentityProfile.signature}
                        onChange={(event) =>
                          updateLanguageIdentityText("signature", event.target.value)
                        }
                        placeholder={defaultLanguageIdentityProfile.signature}
                      />
                    </label>

                    <label className="field field-wide">
                      <span>Ton</span>
                      <textarea
                        value={languageIdentityProfile.tone}
                        onChange={(event) =>
                          updateLanguageIdentityText("tone", event.target.value)
                        }
                        placeholder={defaultLanguageIdentityProfile.tone}
                      />
                    </label>

                    <label className="field">
                      <span>Cevap ilkeleri</span>
                      <textarea
                        value={languageIdentityProfile.principles.join("\n")}
                        onChange={(event) =>
                          updateLanguageIdentityLines("principles", event.target.value)
                        }
                      />
                    </label>

                    <label className="field">
                      <span>Kaçınılacaklar</span>
                      <textarea
                        value={languageIdentityProfile.avoid.join("\n")}
                        onChange={(event) =>
                          updateLanguageIdentityLines("avoid", event.target.value)
                        }
                      />
                    </label>

                    <label className="field field-wide">
                      <span>Doğal açılış örnekleri</span>
                      <textarea
                        value={languageIdentityProfile.sampleOpenings.join("\n")}
                        onChange={(event) =>
                          updateLanguageIdentityLines(
                            "sampleOpenings",
                            event.target.value
                          )
                        }
                      />
                    </label>
                  </div>

                  <div className="actions">
                    <button onClick={runLanguageIdentityEngine}>
                      Dil kimliğini özgünleştir
                    </button>
                    <button
                      className="muted-button"
                      onClick={resetLanguageIdentityProfile}
                    >
                      Varsayılana dön
                    </button>
                  </div>

                  {languageIdentityMessage && (
                    <p className="ok-text">{languageIdentityMessage}</p>
                  )}
                </section>

                <div className="actions">
                  <button onClick={runPersonaEngine}>Persona motorunu çalıştır</button>
                  <button className="muted-button" onClick={() => openHubTab("upgrades")}>
                    Yükseltmeler'e geç
                  </button>
                </div>

                {personaEngineMessage && (
                  <p className="ok-text">{personaEngineMessage}</p>
                )}

                <div className="persona-notes">
                  <article className="persona-note-card">
                    <strong>OC bu persona için ekledikleri</strong>
                    <ul>
                      {personaProfile.additions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="persona-note-card">
                    <strong>Özet</strong>
                    <p>{personaProfile.summary}</p>
                  </article>
                </div>
              </div>
            </div>
          </section>
        )}

        {page === "hub" && hubTab === "upgrades" && (
          <section className="panel">
            <header>
              <div>
                <h2>Yükseltmeler</h2>
                <p>
                  OC'in görsel, ses, görüntü ve genel farkındalık
                  yeteneklerini güvenli sırayla olgunlaştır.
                </p>
              </div>
              <div className="header-actions">
                <span className="pill">Upgrade Flow</span>
                <button
                  className="muted-button close-button"
                  onClick={() => openHubTab("capabilities")}
                >
                  Kapat
                </button>
              </div>
            </header>

            <div className="warning">
              Bu ekran, canlı olmayan özellikleri dürüstçe işaretler ve hangi
              altyapının sırada olduğunu gösterir. Önce yerel-first çekirdek,
              sonra multimodal katmanlar.
            </div>

            <div className="actions">
              <button onClick={runUpgradeEngine}>Yükseltme motorunu çalıştır</button>
              <button className="muted-button" onClick={() => setPage("persona")}>
                Persona'yı aç
              </button>
            </div>

            {upgradeEngineMessage && (
              <p className="ok-text">{upgradeEngineMessage}</p>
            )}

            {upgradeEngineReport && (
              <div className="upgrade-engine-box">
                <div className="upgrade-engine-head">
                  <div>
                    <strong>Motor çıktısı</strong>
                    <p className="hint">
                      Son çalışma:{" "}
                      {new Date(upgradeEngineReport.runAt).toLocaleString("tr-TR")}
                    </p>
                  </div>
                  <span className="pill">{upgradeEngineReport.focus}</span>
                </div>

                <p>{upgradeEngineReport.summary}</p>

                <div className="upgrade-engine-grid">
                  <article className="upgrade-engine-card">
                    <strong>Hazır olanlar</strong>
                    <ul>
                      {upgradeEngineReport.ready.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="upgrade-engine-card">
                    <strong>Eksikler</strong>
                    <ul>
                      {upgradeEngineReport.gaps.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="upgrade-engine-card">
                    <strong>Sonraki adımlar</strong>
                    <ul>
                      {upgradeEngineReport.nextSteps.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                </div>
              </div>
            )}

            <p className="hint">
              Kartların sağ üstündeki menüden sıralama yapabilir veya istersen kartları
              sürükleyerek düzenleyebilirsin.
            </p>

            <div className="upgrade-grid">
              {orderedUpgradeStages.map((stage, index) => {
                const isMenuOpen = upgradeStageMenuOpenId === stage.id;

                return (
                  <article className="upgrade-card" key={stage.id}>
                    <div className="card-menu-wrap">
                      <button
                        className="card-menu-button"
                        onClick={() => openUpgradeStageMenu(stage.id)}
                        aria-label={`${stage.title} menüsü`}
                      >
                        <span />
                        <span />
                        <span />
                      </button>

                      {isMenuOpen && (
                        <div className="card-menu">
                          <button
                            onClick={() => {
                              moveUpgradeStageByOffset(stage.id, -1);
                              setUpgradeStageMenuOpenId(null);
                            }}
                          >
                            Yukarı taşı
                          </button>
                          <button
                            onClick={() => {
                              moveUpgradeStageByOffset(stage.id, 1);
                              setUpgradeStageMenuOpenId(null);
                            }}
                          >
                            Aşağı taşı
                          </button>
                          <button
                            onClick={() => {
                              moveUpgradeStageOrder(stage.id, orderedUpgradeStages[0].id);
                              setUpgradeStageMenuOpenId(null);
                            }}
                          >
                            En üste al
                          </button>
                          <button
                            onClick={() => {
                              moveUpgradeStageOrder(
                                stage.id,
                                orderedUpgradeStages[orderedUpgradeStages.length - 1].id
                              );
                              setUpgradeStageMenuOpenId(null);
                            }}
                          >
                            En alta al
                          </button>
                          <button
                            className="muted-button"
                            onClick={resetUpgradeStageOrder}
                          >
                            Sırayı sıfırla
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="card-top">
                      <h3>
                        {index + 1}. {stage.title}
                      </h3>
                      <span className={`badge ${stage.status}`}>
                        {stage.status === "active" ? "Şimdi" : "Sırada"}
                      </span>
                    </div>
                    <p>{stage.summary}</p>
                    <ul>
                      {stage.required.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <div className="card-actions-inline">
                      <button
                        className="muted-button"
                        onClick={() =>
                          autoApplySuggestion(
                            stage.title,
                            stage.summary,
                            undefined,
                            undefined,
                            "upgrade-stage"
                          )
                        }
                      >
                        Yükselt
                      </button>
                    </div>
                  </article>
                );
              })} 
            </div>
          </section>
        )}

        {page === "continuation" && (
          <section className="panel">
            <header>
              <div>
                <h2>Devam Modeli</h2>
                <p>
                  İşler tamamlandıktan sonra OC'in hangi güvenli adımla
                  ilerleyeceğini açıkça üret.
                </p>
              </div>
              <div className="header-actions">
                <span className="pill">Continuation Engine</span>
                <button
                  className="muted-button close-button"
                  onClick={() => openHubTab("capabilities")}
                >
                  Kapat
                </button>
              </div>
            </header>

            <div className="warning">
              Bu motor gerçek bir arka plan ajanı değildir; yerel durumdan
              bağlayıp bir sonraki güvenli adımı, sorumlu handoff ile üretir.
            </div>

            <div className="actions">
              <button onClick={runContinuationModel}>Devam modelini çalıştır</button>
              <button className="muted-button" onClick={() => setPage("persona")}>
                Persona'yı aç
              </button>
              <button className="muted-button" onClick={() => openHubTab("upgrades")}>
                Yükseltmeler'e git
              </button>
            </div>

            <div className="settings">
              <div>
                <h3>Otomatik devam</h3>
                <button
                  onClick={() => setContinuationMode((current) => !current)}
                >
                  {continuationMode ? "Açık" : "Kapalı"}
                </button>
              </div>
            </div>

            {continuationMessage && (
              <p className="ok-text">{continuationMessage}</p>
            )}

            {continuationPlan && (
              <div className="continuation-box">
                <div className="upgrade-engine-head">
                  <div>
                    <strong>Handoff</strong>
                    <p className="hint">
                      Son çalışma:{" "}
                      {new Date(continuationPlan.runAt).toLocaleString("tr-TR")}
                    </p>
                  </div>
                  <span className="pill">{continuationPlan.nextPageLabel}</span>
                </div>

                <p>{continuationPlan.handoff}</p>

                <div className="upgrade-engine-grid">
                  <article className="upgrade-engine-card">
                    <strong>Korunacaklar</strong>
                    <ul>
                      {continuationPlan.carryForward.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="upgrade-engine-card">
                    <strong>Bir sonraki adım</strong>
                    <ul>
                      {continuationPlan.nextSteps.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                </div>

                <div className="actions">
                  <button onClick={() => goToPlanTarget(continuationPlan)}>
                    {continuationPlan.nextPageLabel}'e git
                  </button>
                  <button
                    className="muted-button"
                    onClick={() => setContinuationPlan(null)}
                  >
                    Planı temizle
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {page === "hub" && hubTab === "models" && (
          <section className="panel">
            <header>
              <div>
                <h2>Modeller</h2>
                <p>Yerel model yönetimini açık ve şeffaf şekilde sürdür.</p>
              </div>
              <span className="pill">Ollama</span>
            </header>

            <div className="warning">
              ChatGPT ve Gemini seçenekleri roadmap'te planlıdır; v0.1-alpha'da
              gerçek cevap üretimi yalnızca Ollama (Local) ile yapılır.
            </div>

            <div className="model-box">
              <label className="field">
                <span>Model adı</span>
                <input
                  value={model}
                  onChange={(event) =>
                    applyModelSelection(event.target.value, "model kutusu")
                  }
                  placeholder="llama3.2:3b"
                />
              </label>

              <button onClick={checkOllama}>
                Ollama bağlantısını kontrol et
              </button>
            </div>

            <p className="hint">
              Örnek modeller: <code>llama3.2:3b</code>, <code>gemma3:4b</code>,{" "}
              <code>qwen2.5:7b</code>
            </p>

            <div className="actions">
              {["llama3.2:3b", "gemma3:4b", "qwen2.5:7b"].map((item) => (
                <button
                  key={item}
                  onClick={() => applyModelSelection(item, "önerilen model")}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="info-box">
              Ollama durumu:{" "}
              <strong>
                {ollamaStatus === "online"
                  ? "Bağlı"
                  : ollamaStatus === "offline"
                  ? "Kapalı / erişilemiyor"
                  : "Henüz kontrol edilmedi"}
              </strong>
            </div>

            {ollamaStatus === "online" && availableModels.length === 0 && (
              <div className="warning">
                Ollama çalışıyor, ancak yüklü model bulunamadı. Terminalde{" "}
                <code>ollama pull llama3.2:3b</code> veya çok dilli kalite için{" "}
                <code>ollama pull gemma3:4b</code> çalıştır.
              </div>
            )}

            {availableModels.length > 0 && (
              <div className="model-list">
                <h3>Yüklü modeller</h3>
                {availableModels.map((item) => (
                  <button
                    key={item.name}
                    className={item.name === model ? "selected-model" : ""}
                    onClick={() =>
                      applyModelSelection(item.name, "yüklü model listesi")
                    }
                  >
                    <span>{item.name}</span>
                    <small>{formatModelSize(item.size)}</small>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {page === "license" && (
          <section className="panel">
            <header>
              <div>
                <h2>Lisans</h2>
                <p>EULA, gizlilik, telemetry rızası ve token durumu.</p>
              </div>
              <span className={`pill ${isLicensed ? "success" : "danger"}`}>
                {licenseText(licenseStatus)}
              </span>
            </header>

            <div className="license-grid">
              <div className="license-card">
                <h3>EULA Kabulü</h3>
                <p>
                  OC kullanımı token temelli lisans sözleşmesine bağlıdır.
                </p>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={eulaAccepted}
                    onChange={(event) => setEulaAccepted(event.target.checked)}
                  />
                  <span>EULA ğartlarını okudum ve kabul ediyorum.</span>
                </label>
              </div>

              <div className="license-card">
                <h3>Gizlilik Bildirimi</h3>
                <p>
                  Offline konuşmalar cihazda kalır. Online doğrulama/telemetry
                  ayrıca yönetilir.
                </p>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(event) =>
                      setPrivacyAccepted(event.target.checked)
                    }
                  />
                  <span>Gizlilik bildirimini okudum ve anladım.</span>
                </label>
              </div>

              <div className="license-card">
                <h3>Telemetry / Audit</h3>
                <p>
                  Telemetry, lisans denetimi ve hata takibi için ayrıca izin
                  ister.
                </p>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={telemetryAccepted}
                    onChange={(event) =>
                      setTelemetryAccepted(event.target.checked)
                    }
                  />
                  <span>Telemetry / audit kullanımına izin veriyorum.</span>
                </label>
              </div>
            </div>

            <div className="token-box">
              <label className="field">
                <span>License Token</span>
                <input
                  value={licenseToken}
                  onChange={(event) => setLicenseToken(event.target.value)}
                  placeholder="COREI-..."
                />
              </label>

              <div className="actions">
                <button onClick={validateLicense}>Token doğrula</button>
                <button onClick={activateDevLicense}>
                  Dev lisansı aktif et
                </button>
                <button onClick={resetLicense}>Lisansı sıfırla</button>
              </div>

              <p className="hint">
                Bu aşamada doğrulama arayüz prototipidir. Gerçek sürümde token
                imza kontrolü Rust/Tauri tarafında yapılacak.
              </p>
            </div>
          </section>
        )}

        {page === "settings" && (
          <section className="panel">
            <header>
              <div>
                <h2>Ayarlar</h2>
                <p>OC çekirdek davranış ayarları.</p>
                <p className="hint">
                  Not: Bu ayarlar yalnızca admin tarafından manuel değiştirilir.
                  Motor bu alanı otomatik güncellemez.
                </p>
              </div>
              <span className="pill">v0.1-alpha</span>
            </header>

            {isAdmin && (
              <div className="card" style={{ marginBottom: 16 }}>
                <h3>Kullanıcı yönetimi (Lokal)</h3>
                <p>
                  Yeni kullanıcılar önce admin onayına düşer. Onaylanan hesaplar
                  giriş yapabilir. Veriler yalnızca bu cihazdaki localStorage içinde
                  tutulur.
                </p>
                <p className="hint">
                  Admin kimliği sabit: {MASTER_ADMIN_PROFILE.fullName} •{" "}
                  {MASTER_ADMIN_PROFILE.email} • {MASTER_ADMIN_PROFILE.phone}.
                  Admin kullanıcı pasifleştirilemez.
                </p>
                <h4 style={{ marginTop: 12 }}>Onay bekleyen kullanıcılar</h4>
                {pendingAccounts.length === 0 ? <p className="hint">Yok.</p> : null}
                {pendingAccounts.length > 0 && (
                  <div className="model-list">
                    {pendingAccounts.map((item) => (
                      <div key={item.username} className="status-log-item info">
                        <span className="status-log-text">
                          {item.username} •{" "}
                          {new Date(item.createdAt).toLocaleString("tr-TR")}
                        </span>
                        <button onClick={() => approvePendingAccount(item.username)}>
                          Onayla
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <h4 style={{ marginTop: 16 }}>Kullanıcı erişim kontrolü</h4>
                {manageableAccounts.length === 0 ? (
                  <p className="hint">Yönetilecek kullanıcı yok.</p>
                ) : (
                  <div className="model-list">
                    {manageableAccounts.map((item) => (
                      <div key={item.username} className="status-log-item info">
                        <span className="status-log-text">
                          {item.username} • {item.approvalStatus === "approved" ? "Onaylı" : "Onay bekliyor"} •{" "}
                          {item.accessStatus === "active" ? "Aktif" : "Pasif"}
                        </span>
                        <button onClick={() => toggleAccountAccess(item.username)}>
                          {item.accessStatus === "active" ? "Pasif et" : "Aktif et"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <h4 style={{ marginTop: 16 }}>Admin onay geçmişi</h4>
                {approvalHistory.length === 0 ? (
                  <p className="hint">Henüz onay kaydı yok.</p>
                ) : (
                  <div className="status-log-list">
                    {approvalHistory.slice(0, 10).map((item) => (
                      <div key={`${item.username}-${item.approvedAt}`} className="status-log-item success">
                        <span className="status-log-text">
                          {item.username} •{" "}
                          {item.approvedAt
                            ? new Date(item.approvedAt).toLocaleString("tr-TR")
                            : "-"}{" "}
                          • {item.approvedBy || "admin"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <h4 style={{ marginTop: 16 }}>Geçici profil değişiklik kuyruğu</h4>
                {temporaryChangeProposals.length === 0 ? (
                  <p className="hint">Bekleyen geçici değişiklik yok.</p>
                ) : (
                  <div className="model-list">
                    {temporaryChangeProposals.slice(0, 20).map((item) => (
                      <div key={item.id} className="status-log-item info">
                        <span className="status-log-text">
                          {item.title} • {item.targetType} • {item.status}
                          <br />
                          <small>
                            {item.description}
                            {item.operationId ? ` • ${item.operationId}` : ""}
                          </small>
                        </span>
                        {item.status === "pending" ? (
                          <div className="card-actions-inline">
                            <button onClick={() => reviewTemporaryChange(item.id, true)}>
                              Onayla
                            </button>
                            <button
                              className="danger-button"
                              onClick={() => reviewTemporaryChange(item.id, false)}
                            >
                              Reddet
                            </button>
                          </div>
                        ) : (
                          <small>
                            {item.reviewedBy || "admin"} •{" "}
                            {item.reviewedAt
                              ? new Date(item.reviewedAt).toLocaleString("tr-TR")
                              : "-"}
                          </small>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="settings">
              <div>
                <h3>Offline öncelikli çalışma</h3>
                <button onClick={toggleOnlineAccessSetting} disabled={!isAdmin}>
                  {onlineAccessEnabled ? "✓ Online" : "Offline"}
                </button>
              </div>
              <div>
                <h3>UI dili</h3>
                <select
                  value={uiLanguage}
                  disabled={!isAdmin}
                  onChange={(event) =>
                    setUiLanguage(event.target.value === "en" ? "en" : "tr")
                  }
                >
                  <option value="tr">Türkçe</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <h3>Safe Mode</h3>
                <strong>Açık</strong>
              </div>
              <div>
                <h3>Stealth / manipüle cevap</h3>
                <strong>Yok</strong>
              </div>
              <div>
                <h3>Geçersiz lisans davranışı</h3>
                <strong>Açık sınırlı mod</strong>
              </div>
              <div>
                <h3>Kullanıcıdan öğrenme</h3>
                <button onClick={toggleLearningFromUserSetting} disabled={!isAdmin}>
                  {learningFromUser ? "Açık" : "Kapalı"}
                </button>
              </div>
              <div>
                <h3>Yaratıcı stil öğrenme</h3>
                <button onClick={toggleCreativeStyleLearningSetting} disabled={!isAdmin}>
                  {creativeStyleLearning ? "Açık" : "Kapalı"}
                </button>
              </div>
              <div>
                <h3>Yetenek geliştirme</h3>
                <button onClick={toggleCapabilityDevelopmentSetting} disabled={!isAdmin}>
                  {capabilityDevelopment ? "Açık" : "Kapalı"}
                </button>
              </div>
              <div>
                <h3>Trend farkındalığı</h3>
                <button onClick={toggleTrendAwareRepliesSetting} disabled={!isAdmin}>
                  {trendAwareReplies ? "Açık" : "Kapalı"}
                </button>
              </div>
              <div>
                <h3>Sohbet geçmişi</h3>
                <button onClick={clearLocalMemory} disabled={!isAdmin}>
                  Hafızayı temizle
                </button>
              </div>
            </div>

            {isAdmin && (
              <div className="info-box settings-memory-box">
                <div className="settings-memory-head">
                  <div>
                    <h3>Hafızayı oluşturan başlıklar</h3>
                    <p className="hint">
                      Sohbet geçmişindeki kullanıcı mesajlarından otomatik derlenir.
                      İstediğin başlığı silebilir veya bağlam dışına alabilirsin.
                    </p>
                  </div>
                  <div className="settings-memory-head-actions">
                    <span className="pill">{chatMemoryTopics.length} başlık</span>
                    <button
                      className="muted-button"
                      onClick={() =>
                        setMemoryTopicsExpanded((current) => {
                          if (current) {
                            setMemoryTopicMenuOpenKey(null);
                          }
                          return !current;
                        })
                      }
                    >
                      {memoryTopicsExpanded ? "Menüyü kapat" : "Menüyü aç"}
                    </button>
                  </div>
                </div>

                {memoryTopicsExpanded && (
                  <>
                    <label className="field settings-memory-search">
                      <span>Başlıklarda ara</span>
                      <input
                        value={memoryTopicSearch}
                        onChange={(event) => setMemoryTopicSearch(event.target.value)}
                        placeholder="Örn: model, lisans, persona"
                      />
                    </label>

                    {filteredChatMemoryTopics.length === 0 ? (
                      <p className="hint">
                        {chatMemoryTopics.length === 0
                          ? "Henüz derlenen bir hafıza başlığı yok."
                          : "Aramaya uygun başlık bulunamadı."}
                      </p>
                    ) : (
                      <div className="settings-memory-list">
                        {filteredChatMemoryTopics.map((topic) => {
                          const isExcluded = chatMemoryExcludedTopics.includes(topic.key);
                          const isMenuOpen = memoryTopicMenuOpenKey === topic.key;

                          return (
                            <article key={topic.key} className="settings-memory-item">
                              <div>
                                <strong>{topic.title}</strong>
                                <p className="hint">
                                  Kayıt sayısı: {topic.count}{" "}
                                  {isExcluded ? "• Bağlam dışı (gizli hafıza)" : ""}
                                </p>
                              </div>

                              <div className="settings-memory-menu-wrap">
                                <button
                                  className="card-menu-button"
                                  onClick={() =>
                                    setMemoryTopicMenuOpenKey((current) =>
                                      current === topic.key ? null : topic.key
                                    )
                                  }
                                  aria-label={`${topic.title} menüsü`}
                                >
                                  <span />
                                  <span />
                                  <span />
                                </button>

                                {isMenuOpen && (
                                  <div className="card-menu settings-memory-menu">
                                    <button onClick={() => removeMemoryTopicByKey(topic.key)}>
                                      Başlığı kaldır (sil)
                                    </button>
                                    <button onClick={() => toggleTopicContextExclusion(topic)}>
                                      {isExcluded
                                        ? "Bağlama tekrar dahil et"
                                        : "Bağlama dahil etme"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                <div className="settings-memory-subsection">
                  <h4>Dış görüşmeler</h4>
                  <p className="hint">
                    Sohbet linkleri üzerinden yapılan misafir konuşmaları burada
                    tutulur ve genel hafıza akışına kaydedilir.
                  </p>

                  {externalConversationList.length === 0 ? (
                    <p className="hint">Henüz dış görüşme kaydı yok.</p>
                  ) : (
                    <div className="settings-memory-list">
                      {externalConversationList.map((item) => (
                        <article
                          key={item.id}
                          className="settings-memory-item external-memory-item"
                        >
                          <div>
                            <strong>{item.topic}</strong>
                            <p className="hint">
                              Kişi: {item.recipientLabel}
                              {item.guestDisplayName
                                ? ` / Katılımcı: ${item.guestDisplayName}`
                                : ""}
                            </p>
                            <p className="hint">
                              Durum: {item.status} • Mesaj: {item.messageCount} • Son
                              güncelleme:{" "}
                              {new Date(
                                item.lastMessageAt ||
                                  item.completedAt ||
                                  item.createdAt
                              ).toLocaleString("tr-TR")}
                            </p>
                            <p className="hint">{item.summary}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>

                {memoryAdminMessage && <p className="ok-text">{memoryAdminMessage}</p>}
                {memoryAdminError && <p className="error-text">{memoryAdminError}</p>}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;




