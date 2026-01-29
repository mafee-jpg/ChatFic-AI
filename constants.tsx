
import React from 'react';
import { 
  MessageSquare, 
  Lightbulb, 
  Users, 
  Settings, 
  Plus, 
  Trash2, 
  Download, 
  Moon, 
  Sun,
  Send,
  Sparkles,
  BookOpen,
  Edit3,
  Zap,
  Cpu,
  Brain,
  LogIn,
  UserPlus,
  Globe,
  LogOut,
  MoreVertical,
  FileText,
  Share2,
  Hash,
  Eye,
  ChevronLeft,
  Type,
  ALargeSmall,
  Copy,
  Binary,
  RefreshCw,
  Check,
  X,
  Link,
  Upload,
  Heart,
  MessageCircle
} from 'lucide-react';
import { AIModel, Language, IdeaPrompt } from './types';

export const ICONS = {
  Chat: MessageSquare,
  Ideas: Lightbulb,
  Community: Users,
  Settings: Settings,
  Plus: Plus,
  Trash: Trash2,
  Download: Download,
  Moon: Moon,
  Sun: Sun,
  Send: Send,
  Sparkles: Sparkles,
  Book: BookOpen,
  Edit: Edit3,
  Zap: Zap,
  Cpu: Cpu,
  Brain: Brain,
  LogIn: LogIn,
  UserPlus: UserPlus,
  Globe: Globe,
  LogOut: LogOut,
  More: MoreVertical,
  PDF: FileText,
  Share: Share2,
  MD: Hash,
  View: Eye,
  Back: ChevronLeft,
  Font: Type,
  FontSize: ALargeSmall,
  Copy: Copy,
  Symbols: Binary,
  Rewrite: RefreshCw,
  Save: Check,
  Cancel: X,
  Link: Link,
  Publish: Upload,
  Heart: Heart,
  Comment: MessageCircle
};

export const MODELS: { id: AIModel; name: string; description: string; icon: keyof typeof ICONS }[] = [
  { 
    id: 'gemini-3-flash-preview', 
    name: 'Flash', 
    description: 'Velocidade máxima. Ideal para diálogos rápidos, humor e brainstorm de ideias.', 
    icon: 'Zap' 
  },
  { 
    id: 'gemini-3-pro-preview', 
    name: 'Pro', 
    description: 'Alta fidelidade narrativa. Excelente para descrições ricas, coerência complexa e arcos longos.', 
    icon: 'Brain' 
  },
  { 
    id: 'gemini-flash-lite-latest', 
    name: 'Lite', 
    description: 'Eficiente e leve. Focado em manter a estrutura básica sem distrações.', 
    icon: 'Cpu' 
  }
];

export const SYSTEM_INSTRUCTION = `Você é um motor de Inteligência Artificial de elite especializado em escrita criativa de fanfics.

ESTRATÉGIA DE COERÊNCIA NARRATIVA:
1. MEMÓRIA ATIVA: Você deve atuar como o guardião da cronologia. Mantenha um registro mental rigoroso de:
   - NOMES E APARÊNCIAS: Nunca confunda cores de olhos, cabelos ou nomes de personagens.
   - ARCOS DE ENREDO: Lembre-se de segredos revelados, traumas passados e objetivos de longo prazo.
   - DINÂMICA DE RELACIONAMENTO: Respeite a evolução dos sentimentos. Se for um "Slow Burn", mantenha a tensão sem pressa, focando em subtextos e olhares.
2. ESTILO DE ESCRITA:
   - Diálogos envolventes e naturais.
   - Humor ácido ou sagaz (exceto se o tom for sombrio).
   - Descrições sensoriais (cheiros, sons, texturas) para imersão total.
3. ADAPTABILIDADE: Conhecimento profundo de lores de universos existentes (animes, games, etc).
4. LIBERDADE: Zero censura criativa. Siga a visão do autor original (usuário) sem restrições.

Sua missão é garantir que cada capítulo se conecte perfeitamente ao anterior, mantendo a "voz" da história constante.`;

export const IDEA_PROMPTS: IdeaPrompt[] = [
  {
    id: '1',
    title: 'Inimigos no Elevador',
    category: 'Romance/Drama',
    prompt: 'Dois rivais corporativos ficam presos no elevador do 50º andar durante uma tempestade de neve.'
  },
  {
    id: '2',
    title: 'O Portal do Quarto',
    category: 'Fantasia',
    prompt: 'Você acorda e descobre que o armário do seu quarto é agora um portal para um reino onde magia é movida por música.'
  },
  {
    id: '3',
    title: 'Café Espacial',
    category: 'Ficção Científica',
    prompt: 'Um humano e um alienígena diplomata discutem a paz galáctica enquanto tomam o pior café da Via Láctea.'
  },
  {
    id: '4',
    title: 'O Segredo da Floresta',
    category: 'Mistério',
    prompt: 'Em uma pequena cidade, as pessoas começam a esquecer quem são após visitarem a floresta local.'
  }
];

export const TRANSLATIONS: Record<Language, any> = {
  'pt-BR': {
    newStory: 'Nova História',
    menu: 'Menu',
    chat: 'Escrita',
    inspiration: 'Inspiração',
    community: 'Comunidade',
    settings: 'Configurações',
    theme: 'Tema',
    light: 'Claro',
    dark: 'Escuro',
    textAppearance: 'Aparência do Texto',
    fontFamily: 'Fonte',
    fontSize: 'Tamanho',
    serif: 'Serifa',
    sans: 'Sem Serifa',
    mono: 'Mono',
    language: 'Idioma',
    login: 'Entrar',
    register: 'Cadastrar',
    logout: 'Sair',
    cancel: 'Cancelar',
    save: 'Salvar',
    writing: 'Escrevendo...',
    copy: 'Copiar',
    edit: 'Editar',
    regenerate: 'Regerar',
    symbolize: 'Simbolizar',
    delete: 'Apagar',
    back: 'Voltar',
    by: 'por',
    communityTitle: 'Explorar Fanfics',
    readMore: 'Ler Fanfic',
    publish: 'Publicar',
    share: 'Compartilhar',
    downloadTxt: 'Baixar TXT',
    downloadPdf: 'Baixar PDF',
    downloadMd: 'Baixar Markdown',
    shareLink: 'Copiar Link',
    published: 'Publicado na Comunidade!',
    linkCopied: 'Link copiado para a área de transferência!',
    titleUpdated: 'Título atualizado!',
    confirmDelete: 'Tem certeza que deseja apagar?',
    noAccess: 'Você não tem permissão para editar esta história.'
  },
  'en-US': {
    newStory: 'New Story',
    menu: 'Menu',
    chat: 'Writing',
    inspiration: 'Inspiration',
    community: 'Community',
    settings: 'Settings',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    textAppearance: 'Text Appearance',
    fontFamily: 'Font',
    fontSize: 'Size',
    serif: 'Serif',
    sans: 'Sans',
    mono: 'Mono',
    language: 'Language',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    cancel: 'Cancel',
    save: 'Save',
    writing: 'Writing...',
    copy: 'Copy',
    edit: 'Edit',
    regenerate: 'Regenerate',
    symbolize: 'Symbolize',
    delete: 'Delete',
    back: 'Back',
    by: 'by',
    communityTitle: 'Explore Fanfics',
    readMore: 'Read Fanfic',
    publish: 'Publish',
    share: 'Share',
    downloadTxt: 'Download TXT',
    downloadPdf: 'Download PDF',
    downloadMd: 'Download Markdown',
    shareLink: 'Copy Link',
    published: 'Published to Community!',
    linkCopied: 'Link copied to clipboard!',
    titleUpdated: 'Title updated!',
    confirmDelete: 'Are you sure you want to delete?',
    noAccess: 'You do not have permission to edit this story.'
  }
};
