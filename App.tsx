
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Story, Message, IdeaPrompt, AIModel, Language, User } from './types';
import { ICONS, IDEA_PROMPTS, MODELS, TRANSLATIONS } from './constants';
import { generateStoryContent } from './services/gemini';
import { GoogleGenAI } from "@google/genai";
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  const [view, setView] = useState<View>('chat');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('pt-BR');
  const [chatFont, setChatFont] = useState<'sans' | 'serif' | 'mono'>('serif');
  const [chatFontSize, setChatFontSize] = useState<number>(18);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  const [stories, setStories] = useState<Story[]>([]);
  const [communityStories, setCommunityStories] = useState<Story[]>([]);
  const [customIdeas, setCustomIdeas] = useState<IdeaPrompt[]>([]);
  const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);
  
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const [readingStory, setReadingStory] = useState<Story | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState<AIModel>('gemini-3-flash-preview');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingText, setRenamingText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modelPickerRef = useRef<HTMLDivElement>(null);
  const optionsDropdownRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[language];

  const allIdeas = useMemo(() => [...customIdeas, ...IDEA_PROMPTS], [customIdeas]);

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('##')) {
        return (
          <h2 key={idx} className="text-3xl font-black mb-4 mt-6 text-purple-600 dark:text-purple-400 leading-tight">
            {line.replace(/^##\s*/, '').trim()}
          </h2>
        );
      }
      const elements: (string | React.ReactNode)[] = [line];
      let boldRegex = /\*\*(.*?)\*\*/g;
      let newElements: (string | React.ReactNode)[] = [];
      elements.forEach(el => {
        if (typeof el === 'string') {
          const parts = el.split(boldRegex);
          parts.forEach((part, i) => {
            if (i % 2 === 1) {
              newElements.push(<strong key={`${idx}-b-${i}`} className="font-black text-purple-800 dark:text-purple-200">{part}</strong>);
            } else if (part) {
              newElements.push(part);
            }
          });
        } else {
          newElements.push(el);
        }
      });
      let italicElements: (string | React.ReactNode)[] = [];
      let italicRegex = /\*(.*?)\*/g;
      newElements.forEach(el => {
        if (typeof el === 'string') {
          const parts = el.split(italicRegex);
          parts.forEach((part, i) => {
            if (i % 2 === 1) {
              italicElements.push(<em key={`${idx}-i-${i}`} className="italic opacity-90">{part}</em>);
            } else if (part) {
              italicElements.push(part);
            }
          });
        } else {
          italicElements.push(el);
        }
      });
      return <p key={idx} className="mb-2 last:mb-0 leading-relaxed">{italicElements}</p>;
    });
  };

  const generateNewIdea = async () => {
    setIsGeneratingIdea(true);
    try {
      const apiKey = process.env.API_KEY || '';
      if (!apiKey) throw new Error("API Key missing");
      
      const ai = new GoogleGenAI({ apiKey });
      const prompt = language === 'pt-BR' 
        ? "Gere uma ideia criativa e única para uma fanfic. Retorne APENAS um JSON no formato: { \"title\": \"Título\", \"category\": \"Categoria\", \"prompt\": \"Descrição da ideia\" }. Seja criativo e evite clichês."
        : "Generate a creative and unique fanfiction idea. Return ONLY a JSON in the format: { \"title\": \"Title\", \"category\": \"Category\", \"prompt\": \"Prompt description\" }. Be creative and avoid clichés.";

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const ideaData = JSON.parse(response.text || '{}');
      const newIdea: IdeaPrompt = {
        id: Date.now().toString(),
        title: ideaData.title || (language === 'pt-BR' ? 'Ideia sem título' : 'Untitled Idea'),
        category: ideaData.category || 'Geral',
        prompt: ideaData.prompt || '...'
      };

      setCustomIdeas(prev => [newIdea, ...prev]);
    } catch (error) {
      console.error("Error generating idea:", error);
      alert(language === 'pt-BR' ? "Erro ao gerar inspiração. Verifique sua chave de API." : "Error generating inspiration. Check your API key.");
    } finally {
      setIsGeneratingIdea(false);
    }
  };

  const deleteMessage = (storyId: string | null, msgId: string) => {
    if (!storyId) return;
    const confirmMsg = language === 'pt-BR' ? "Apagar esta mensagem permanentemente?" : "Delete this message permanently?";
    if (!window.confirm(confirmMsg)) return;
    
    setStories(prev => prev.map(s => {
      if (s.id === storyId) {
        const filteredMessages = s.messages.filter(m => m.id !== msgId);
        return { ...s, messages: filteredMessages, updatedAt: Date.now() };
      }
      return s;
    }));
  };

  const deleteStory = (id: string) => {
    const confirmMsg = language === 'pt-BR' ? "Tem certeza que deseja apagar esta fanfic inteira?" : "Are you sure you want to delete this entire fanfic?";
    if (!window.confirm(confirmMsg)) return;
    
    setStories(prev => prev.filter(s => s.id !== id));
    setCommunityStories(prev => prev.filter(s => s.id !== id));
    
    if (currentStoryId === id) { 
      setCurrentStoryId(null); 
      setView('chat');
    }
    setShowOptionsDropdown(false);
  };

  const exportAsPDF = (story: Story) => {
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - 2 * margin;
    doc.setFontSize(22);
    doc.text(story.title, margin, 30);
    doc.setFontSize(12);
    doc.text(`${t.by} ${story.author || 'Anônimo'}`, margin, 40);
    doc.text(`${story.universe}`, margin, 45);
    let y = 60;
    story.messages.forEach((msg) => {
      const roleText = msg.role === 'user' ? 'Escritor:' : 'IA:';
      if (y > 280) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      doc.text(roleText, margin, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(msg.content, contentWidth);
      lines.forEach((line: string) => {
        if (y > 280) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += 7;
      });
      y += 10;
    });
    doc.save(`${story.title.replace(/\s+/g, '_')}.pdf`);
  };

  const exportAsMarkdown = (story: Story) => {
    let content = `# ${story.title}\n\n`;
    content += `**Autor:** ${story.author || 'Anônimo'}\n`;
    content += `**Universo:** ${story.universe}\n\n---\n\n`;
    story.messages.forEach(msg => {
      content += `### ${msg.role === 'user' ? 'Autor' : 'IA'}\n\n${msg.content}\n\n`;
    });
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copiado!");
  };

  const regenerateMessage = async (storyId: string, index: number) => {
    const story = stories.find(s => s.id === storyId);
    if (!story || isThinking) return;
    const historyUpTo = story.messages.slice(0, index);
    setStories(prev => prev.map(s => s.id === storyId ? { ...s, messages: historyUpTo } : s));
    await handleGenerate(storyId, historyUpTo, selectedModel);
  };

  const startEditing = (msg: Message) => {
    setEditingId(msg.id);
    setEditingText(msg.content);
  };

  const saveEdit = (storyId: string, msgId: string) => {
    setStories(prev => prev.map(s => s.id === storyId ? { ...s, messages: s.messages.map(m => m.id === msgId ? { ...m, content: editingText } : m) } : s));
    setEditingId(null);
    setEditingText('');
  };

  const handleRename = (id: string) => {
    if (!renamingText.trim()) {
      setRenamingId(null);
      return;
    }
    setStories(prev => prev.map(s => s.id === id ? { ...s, title: renamingText } : s));
    setRenamingId(null);
  };

  useEffect(() => {
    const savedStories = localStorage.getItem('chatfic_stories');
    if (savedStories) setStories(JSON.parse(savedStories));
    const savedCommunity = localStorage.getItem('chatfic_community');
    if (savedCommunity) setCommunityStories(JSON.parse(savedCommunity));
    const savedUser = localStorage.getItem('chatfic_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    const savedLang = localStorage.getItem('chatfic_lang') as Language;
    if (savedLang) setLanguage(savedLang);
    const savedTheme = localStorage.getItem('chatfic_theme');
    if (savedTheme !== null) setIsDarkMode(savedTheme === 'true');
    const savedFontSize = localStorage.getItem('chatfic_font_size');
    if (savedFontSize) setChatFontSize(parseInt(savedFontSize));
    const savedIdeas = localStorage.getItem('chatfic_custom_ideas');
    if (savedIdeas) setCustomIdeas(JSON.parse(savedIdeas));
  }, []);

  useEffect(() => {
    localStorage.setItem('chatfic_stories', JSON.stringify(stories));
    localStorage.setItem('chatfic_community', JSON.stringify(communityStories));
    localStorage.setItem('chatfic_lang', language);
    localStorage.setItem('chatfic_theme', isDarkMode.toString());
    localStorage.setItem('chatfic_font_size', chatFontSize.toString());
    localStorage.setItem('chatfic_custom_ideas', JSON.stringify(customIdeas));
    if (user) localStorage.setItem('chatfic_user', JSON.stringify(user));
  }, [stories, communityStories, language, isDarkMode, chatFontSize, user, customIdeas]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [stories, currentStoryId, isThinking]);

  const activeStory = useMemo(() => stories.find(s => s.id === currentStoryId), [stories, currentStoryId]);
  const publishedStories = useMemo(() => communityStories.filter(s => s.isPublished), [communityStories]);

  const createNewStory = (initialPrompt?: string) => {
    const newStory: Story = {
      id: Date.now().toString(),
      title: language === 'pt-BR' ? 'Nova Fanfic' : 'New Fanfic',
      universe: 'Original',
      messages: initialPrompt ? [{ id: '1', role: 'user', content: initialPrompt, timestamp: Date.now() }] : [],
      updatedAt: Date.now(),
      author: user?.name || 'Anônimo',
      authorId: user?.id || 'anon',
      preferredModel: selectedModel,
      isPublished: false,
    };
    setStories(prev => [newStory, ...prev]);
    setCurrentStoryId(newStory.id);
    setView('chat');
    if (initialPrompt) handleGenerate(newStory.id, [...newStory.messages], selectedModel);
  };

  const handleGenerate = async (storyId: string, messageHistory: Message[], model: AIModel) => {
    setIsThinking(true);
    const aiResponse = await generateStoryContent(messageHistory, model);
    const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: aiResponse, timestamp: Date.now() };
    setStories(prev => prev.map(s => s.id === storyId ? { ...s, messages: [...s.messages, assistantMessage], updatedAt: Date.now() } : s));
    setIsThinking(false);
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isThinking) return;
    let storyId = currentStoryId;
    if (!storyId) {
      const newStory: Story = { id: Date.now().toString(), title: inputValue.slice(0, 20) + '...', universe: 'Original', messages: [], updatedAt: Date.now(), author: user?.name || 'Anônimo', authorId: user?.id || 'anon', preferredModel: selectedModel, isPublished: false };
      setStories(prev => [newStory, ...prev]);
      setCurrentStoryId(newStory.id);
      storyId = newStory.id;
    }
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: inputValue, timestamp: Date.now() };
    const targetStory = stories.find(s => s.id === storyId);
    const currentMsgs = targetStory ? [...targetStory.messages, userMessage] : [userMessage];
    setStories(prev => prev.map(s => s.id === storyId ? { ...s, messages: currentMsgs, updatedAt: Date.now() } : s));
    setInputValue('');
    await handleGenerate(storyId!, currentMsgs, selectedModel);
  };

  const togglePublish = () => {
    if (!currentStoryId) return;
    const storyToUpdate = stories.find(s => s.id === currentStoryId);
    if (!storyToUpdate) return;
    const newPublishState = !storyToUpdate.isPublished;
    setStories(prev => prev.map(s => s.id === currentStoryId ? { ...s, isPublished: newPublishState } : s));
    if (newPublishState) {
      setCommunityStories(prev => {
        const filtered = prev.filter(ps => ps.id !== currentStoryId);
        return [{...storyToUpdate, isPublished: true}, ...filtered];
      });
      alert(t.published);
    } else {
      setCommunityStories(prev => prev.filter(ps => ps.id !== currentStoryId));
      alert(language === 'pt-BR' ? "Removido da comunidade." : "Removed from community.");
    }
    setShowOptionsDropdown(false);
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ id: Date.now().toString(), name: 'Autor Criativo', email: 'autor@chatfic.ai' });
    setView('chat');
  };

  const getMessageStyle = () => {
    let fontFamily = 'font-serif';
    if (chatFont === 'sans') fontFamily = 'font-sans';
    if (chatFont === 'mono') fontFamily = 'font-mono';
    return { className: `${fontFamily} leading-relaxed`, style: { fontSize: `${chatFontSize}px` } };
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-500 ease-in-out border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex flex-col overflow-hidden`}>
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-purple-500/20"><ICONS.Book className="w-6 h-6" /></div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic">Chatfic AI</h1>
        </div>
        <div className="px-6 mb-6">
          <button onClick={() => createNewStory()} className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-black shadow-xl shadow-purple-600/20 transition-all hover:-translate-y-1 text-sm uppercase tracking-widest">
            <ICONS.Plus className="w-5 h-5" /> {t.newStory}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 space-y-2">
          <button onClick={() => setView('chat')} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold transition-all ${view === 'chat' ? 'bg-purple-600 text-white shadow-lg' : 'hover:bg-gray-200 dark:hover:bg-gray-800'}`}><ICONS.Chat className="w-5 h-5" /> {t.chat}</button>
          <button onClick={() => setView('community')} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold transition-all ${view === 'community' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'hover:bg-gray-200 dark:hover:bg-gray-800'}`}><ICONS.Community className="w-5 h-5" /> {t.community}</button>
          <button onClick={() => setView('ideas')} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold transition-all ${view === 'ideas' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'hover:bg-gray-200 dark:hover:bg-gray-800'}`}><ICONS.Ideas className="w-5 h-5" /> {t.inspiration}</button>
          <div className="mt-10 mb-4 px-5 text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">Minhas Histórias</div>
          <div className="space-y-1">
            {stories.map(s => (
              <div key={s.id} className="group relative px-2">
                {renamingId === s.id ? (
                  <div className="flex gap-2 p-1 bg-white dark:bg-gray-800 rounded-xl border border-purple-500 shadow-sm">
                    <input 
                      className="flex-1 bg-transparent px-2 py-1 text-sm outline-none font-bold" 
                      value={renamingText} 
                      onChange={e => setRenamingText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRename(s.id);
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      autoFocus
                    />
                    <button onClick={() => handleRename(s.id)} className="p-1 text-green-500 hover:bg-green-50 rounded-lg"><ICONS.Save className="w-4 h-4"/></button>
                  </div>
                ) : (
                  <div className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${currentStoryId === s.id ? 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700' : 'hover:bg-gray-200 dark:hover:bg-gray-800'}`} onClick={() => { setCurrentStoryId(s.id); setView('chat'); }}>
                    <div className="flex-1 flex items-center gap-3 truncate text-left">
                      <ICONS.MD className={`w-4 h-4 flex-shrink-0 ${s.isPublished ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className="truncate text-sm font-semibold">{s.title}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ml-2 z-10">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          e.preventDefault();
                          setRenamingId(s.id); 
                          setRenamingText(s.title); 
                        }} 
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-purple-600 transition-colors"
                        title={t.edit}
                      >
                        <ICONS.Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          e.preventDefault();
                          deleteStory(s.id); 
                        }} 
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                        title={t.delete}
                      >
                        <ICONS.Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-2">
          <button onClick={() => setView('settings')} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold transition-all ${view === 'settings' ? 'bg-gray-200 dark:bg-gray-800' : 'hover:bg-gray-200 dark:hover:bg-gray-800'}`}><ICONS.Settings className="w-5 h-5" /> {t.settings}</button>
          {!user ? (
            <button onClick={() => setView('auth')} className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-black bg-gray-900 dark:bg-white text-white dark:text-gray-900 uppercase text-[10px] tracking-widest shadow-xl"><ICONS.LogIn className="w-5 h-5" /> {t.login}</button>
          ) : (
             <div className="flex items-center gap-3 px-5 py-3.5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
               <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">{user.name[0]}</div>
               <div className="flex-1 truncate"><p className="text-xs font-bold truncate">{user.name}</p><button onClick={() => setUser(null)} className="text-[10px] text-red-500 font-black uppercase hover:underline">{language === 'pt-BR' ? 'Sair' : 'Logout'}</button></div>
             </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden bg-white dark:bg-gray-900">
        <header className="h-16 flex items-center justify-between px-8 border-b border-gray-100 dark:border-gray-800 z-30">
          <div className="flex items-center gap-6">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"><ICONS.Back className={`w-6 h-6 ${!sidebarOpen ? 'rotate-180' : ''}`} /></button>
            <h2 className="font-black text-lg tracking-tight truncate max-w-[300px]">{view === 'chat' ? (activeStory?.title || t.newStory) : view === 'community' ? t.community : view === 'settings' ? t.settings : t[view]}</h2>
          </div>
          <div className="flex items-center gap-3">
            {view === 'chat' && activeStory && (
              <div className="relative" ref={optionsDropdownRef}>
                <button onClick={() => setShowOptionsDropdown(!showOptionsDropdown)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"><ICONS.More className="w-6 h-6 text-gray-400" /></button>
                {showOptionsDropdown && (
                  <div className="absolute top-12 right-0 w-64 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden">
                    <button onClick={togglePublish} className={`w-full px-4 py-2.5 text-left text-[10px] font-black uppercase flex items-center gap-3 transition-colors ${activeStory.isPublished ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>{activeStory.isPublished ? <ICONS.Cancel className="w-4 h-4" /> : <ICONS.Publish className="w-4 h-4" />} {activeStory.isPublished ? (language === 'pt-BR' ? 'Remover da Comunidade' : 'Remove from Community') : (language === 'pt-BR' ? 'Publicar na Comunidade' : 'Publish to Community')}</button>
                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                    <button onClick={() => exportAsPDF(activeStory)} className="w-full px-4 py-2.5 text-left text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"><ICONS.PDF className="w-4 h-4" /> Baixar PDF</button>
                    <button onClick={() => exportAsMarkdown(activeStory)} className="w-full px-4 py-2.5 text-left text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"><ICONS.MD className="w-4 h-4" /> Baixar Markdown</button>
                    <button onClick={() => deleteStory(activeStory.id)} className="w-full px-4 py-2.5 text-left text-[10px] font-black uppercase text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"><ICONS.Trash className="w-4 h-4" /> Apagar Fanfic</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50 scroll-smooth">
          {view === 'chat' && (
            <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-10 pb-40">
              {(!activeStory || activeStory.messages.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-10">
                  <div className="w-32 h-32 bg-purple-100 dark:bg-purple-900/20 rounded-[40px] flex items-center justify-center text-6xl shadow-inner">📓</div>
                  <div className="space-y-4"><h3 className="text-5xl font-black tracking-tighter uppercase italic">{language === 'pt-BR' ? 'Qual é a próxima aventura?' : 'What is the next adventure?'}</h3><p className="text-gray-400 font-medium text-lg">{language === 'pt-BR' ? 'Inicie com um prompt ou comece a digitar livremente.' : 'Start with a prompt or just start typing.'}</p></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    {allIdeas.slice(0, 4).map(i => (
                      <button key={i.id} onClick={() => createNewStory(i.prompt)} className="p-8 bg-white dark:bg-gray-800 border-2 border-transparent hover:border-purple-500 rounded-[32px] text-left transition-all shadow-sm hover:shadow-xl group"><span className="text-[10px] font-black text-purple-600 uppercase tracking-widest block mb-3">{i.category}</span><p className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-purple-600 transition-colors">{i.prompt}</p></button>
                    ))}
                  </div>
                </div>
              ) : (
                activeStory.messages.map((msg, index) => (
                  <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} mb-8 group`}>
                    <div className="max-w-[90%] relative">
                      {editingId === msg.id ? (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-[24px] border-2 border-purple-500 shadow-2xl space-y-4">
                          <textarea value={editingText} onChange={e => setEditingText(e.target.value)} className="w-full bg-transparent outline-none resize-none min-h-[150px] text-lg font-serif" autoFocus />
                          <div className="flex justify-end gap-2"><button onClick={() => setEditingId(null)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-xs font-black uppercase">{t.cancel}</button><button onClick={() => saveEdit(activeStory.id, msg.id)} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-black uppercase">{t.save}</button></div>
                        </div>
                      ) : (
                        <>
                          <div className={`px-8 py-6 rounded-[32px] shadow-sm transition-all ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-tl-none'}`}>
                            <div className={getMessageStyle().className} style={msg.role === 'assistant' ? getMessageStyle().style : {}}>{renderContent(msg.content)}</div>
                          </div>
                          <div className={`mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <button onClick={() => copyToClipboard(msg.content)} className="p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm hover:text-purple-600 transition-colors" title={t.copy}><ICONS.Copy className="w-4 h-4" /></button>
                            <button onClick={() => startEditing(msg)} className="p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm hover:text-purple-600 transition-colors" title={t.edit}><ICONS.Edit className="w-4 h-4" /></button>
                            {msg.role === 'assistant' && <button onClick={() => regenerateMessage(activeStory.id, index)} className="p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm hover:text-purple-600 transition-colors" title={t.regenerate}><ICONS.Rewrite className="w-4 h-4" /></button>}
                            <button onClick={() => deleteMessage(currentStoryId, msg.id)} className="p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm hover:text-red-500 transition-colors" title={t.delete}><ICONS.Trash className="w-4 h-4" /></button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isThinking && (
                <div className="flex items-center gap-3 animate-pulse ml-2"><div className="flex gap-1.5"><span className="w-2.5 h-2.5 bg-purple-500 rounded-full"></span><span className="w-2.5 h-2.5 bg-purple-500 rounded-full" style={{animationDelay:'0.2s'}}></span><span className="w-2.5 h-2.5 bg-purple-500 rounded-full" style={{animationDelay:'0.4s'}}></span></div><span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">{t.writing}</span></div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {view === 'community' && (
            <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-16 pb-40">
              <div className="space-y-4"><h3 className="text-7xl font-black tracking-tighter uppercase italic leading-none">{t.community}</h3><p className="text-xl text-gray-400 font-medium max-w-2xl">{language === 'pt-BR' ? 'Fanfics compartilhadas por autores. Somente o que você autorizar aparecerá aqui.' : 'Fanfics shared by authors. Only what you authorize will appear here.'}</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {publishedStories.length === 0 ? (<div className="col-span-full py-20 text-center bg-white dark:bg-gray-800 rounded-[48px] border-4 border-dashed border-gray-100 dark:border-gray-700"><p className="text-gray-300 font-black uppercase tracking-widest">{language === 'pt-BR' ? 'Nenhuma história compartilhada ainda.' : 'No stories shared yet.'}</p></div>) : (publishedStories.map(story => (<div key={story.id} className="bg-white dark:bg-gray-800 border-2 border-gray-50 dark:border-gray-700 rounded-[48px] p-10 flex flex-col h-full shadow-sm hover:shadow-2xl transition-all group cursor-pointer" onClick={() => setReadingStory(story)}><div className="flex items-center gap-3 mb-8"><span className="px-4 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 text-[10px] font-black rounded-full uppercase tracking-widest">{story.universe}</span><span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(story.updatedAt).toLocaleDateString()}</span></div><h4 className="text-3xl font-black leading-tight mb-6 group-hover:text-purple-600 transition-colors line-clamp-2">{story.title}</h4><div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-50 dark:border-gray-700"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-[10px] text-white font-black uppercase shadow-lg">{story.author?.slice(0,1)}</div><span className="text-xs font-black uppercase tracking-tighter">{story.author}</span></div><ICONS.View className="w-6 h-6 text-gray-300 group-hover:text-purple-600 transition-colors" /></div></div>)))}
              </div>
              {readingStory && (<div className="fixed inset-0 bg-white dark:bg-gray-950 z-[100] overflow-y-auto p-6 md:p-20"><button onClick={() => setReadingStory(null)} className="fixed top-8 left-8 w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center hover:bg-gray-200 shadow-2xl z-[110]"><ICONS.Back className="w-8 h-8" /></button><div className="max-w-4xl mx-auto space-y-16"><div className="text-center space-y-6 pt-10"><div className="inline-block px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 text-xs font-black uppercase rounded-full tracking-widest">{readingStory.universe}</div><h3 className="text-7xl font-black tracking-tighter leading-none italic">{readingStory.title}</h3><p className="font-bold uppercase text-xs text-gray-400">{t.by} {readingStory.author}</p></div><div className="space-y-24 py-20 border-t border-gray-100 dark:border-gray-800">{readingStory.messages.map(m => (<div key={m.id} className="space-y-8 max-w-3xl mx-auto"><div className="text-2xl font-serif leading-[1.8] dark:text-gray-200 text-gray-800">{renderContent(m.content)}</div></div>))}</div></div></div>)}
            </div>
          )}

          {view === 'settings' && (
            <div className="max-w-2xl mx-auto p-6 md:p-12 space-y-12 pb-40">
              <h3 className="text-5xl font-black tracking-tighter uppercase italic">{t.settings}</h3>
              
              <section className="bg-white dark:bg-gray-800 p-10 rounded-[40px] border border-gray-100 dark:border-gray-700 space-y-8 shadow-sm">
                <div className="flex items-center gap-4 font-black uppercase text-xs text-purple-600 tracking-widest"><ICONS.Globe className="w-5 h-5" /> {t.language}</div>
                <div className="flex gap-4">
                  <button onClick={() => setLanguage('pt-BR')} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2 transition-all ${language === 'pt-BR' ? 'bg-purple-600 border-purple-600 text-white shadow-lg' : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50'}`}>Português</button>
                  <button onClick={() => setLanguage('en-US')} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2 transition-all ${language === 'en-US' ? 'bg-purple-600 border-purple-600 text-white shadow-lg' : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50'}`}>English</button>
                </div>
              </section>

              <section className="bg-white dark:bg-gray-800 p-10 rounded-[40px] border border-gray-100 dark:border-gray-700 space-y-8 shadow-sm"><div className="flex items-center gap-4 font-black uppercase text-xs text-purple-600 tracking-widest"><ICONS.FontSize className="w-5 h-5" /> {t.fontSize}: <span className="text-gray-900 dark:text-white ml-auto">{chatFontSize}px</span></div><input type="range" min="12" max="36" step="1" value={chatFontSize} onChange={(e) => setChatFontSize(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600" /></section>
              <section className="bg-white dark:bg-gray-800 p-10 rounded-[40px] border border-gray-100 dark:border-gray-700 space-y-8 shadow-sm"><div className="flex items-center gap-4 font-black uppercase text-xs text-purple-600 tracking-widest"><ICONS.Moon className="w-5 h-5" /> {t.theme}</div><div className="flex gap-6"><button onClick={() => setIsDarkMode(false)} className={`flex-1 p-8 rounded-[32px] border-2 flex flex-col items-center gap-4 transition-all ${!isDarkMode ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10' : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50'}`}><ICONS.Sun className="w-10 h-10" /><span className="text-[10px] font-black uppercase tracking-widest">{t.light}</span></button><button onClick={() => setIsDarkMode(true)} className={`flex-1 p-8 rounded-[32px] border-2 flex flex-col items-center gap-4 transition-all ${isDarkMode ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10' : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50'}`}><ICONS.Moon className="w-10 h-10" /><span className="text-[10px] font-black uppercase tracking-widest">{t.dark}</span></button></div></section>
            </div>
          )}

          {view === 'auth' && (
            <div className="max-w-md mx-auto py-20"><div className="bg-white dark:bg-gray-800 p-12 rounded-[56px] shadow-2xl border border-gray-100 dark:border-gray-700 space-y-8"><div className="text-center space-y-4"><div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-3xl flex items-center justify-center mx-auto text-purple-600">{authMode === 'login' ? <ICONS.LogIn className="w-10 h-10" /> : <ICONS.UserPlus className="w-10 h-10" />}</div><h3 className="text-4xl font-black uppercase italic tracking-tighter">{authMode === 'login' ? (language === 'pt-BR' ? 'Bem-vindo' : 'Welcome') : (language === 'pt-BR' ? 'Cadastre-se' : 'Register')}</h3></div><form onSubmit={handleAuth} className="space-y-6"><div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest">E-mail</label><input type="email" placeholder="seu@email.com" className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-purple-500 rounded-3xl px-8 py-4 outline-none font-bold" required /></div><div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest">{language === 'pt-BR' ? 'Senha' : 'Password'}</label><input type="password" placeholder="••••••••" className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-purple-500 rounded-3xl px-8 py-4 outline-none font-bold" required /></div><button type="submit" className="w-full bg-purple-600 text-white py-5 rounded-[24px] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-purple-600/30 hover:bg-purple-700 transition-all active:scale-95">{authMode === 'login' ? t.login : t.register}</button></form><div className="text-center"><button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-[10px] font-black text-purple-600 hover:underline uppercase tracking-widest">{authMode === 'login' ? (language === 'pt-BR' ? 'Não tem conta? Registre-se aqui' : "Don't have an account? Register here") : (language === 'pt-BR' ? 'Já tem uma conta? Faça Login' : "Already have an account? Login")}</button></div></div></div>
          )}

          {view === 'ideas' && (
            <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-16 pb-40">
              <div className="flex items-center justify-between gap-6 flex-wrap">
                <h3 className="text-7xl font-black tracking-tighter uppercase italic leading-none">{t.inspiration}</h3>
                <button 
                  onClick={generateNewIdea}
                  disabled={isGeneratingIdea}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-5 rounded-[32px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-purple-600/30 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 flex items-center gap-3"
                >
                  {isGeneratingIdea ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ICONS.Sparkles className="w-5 h-5" />
                  )}
                  {language === 'pt-BR' ? 'Gerar Nova Inspiração' : 'Generate New Inspiration'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {allIdeas.map(i => (
                  <div key={i.id} className="p-12 bg-white dark:bg-gray-800 rounded-[56px] border-2 border-transparent hover:border-purple-500 transition-all flex flex-col gap-8 group shadow-sm hover:shadow-2xl">
                    <span className="px-5 py-2 bg-purple-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest self-start">{i.category}</span>
                    <h4 className="text-4xl font-black leading-tight group-hover:text-purple-600 transition-colors">{i.title}</h4>
                    <p className="text-gray-400 font-serif italic text-xl leading-relaxed">"{i.prompt}"</p>
                    <button onClick={() => createNewStory(i.prompt)} className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-5 rounded-[24px] font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 transition-transform active:scale-95 mt-4">{language === 'pt-BR' ? 'Iniciar História' : 'Start Story'}</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {view === 'chat' && (
          <div className="px-6 py-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 z-40">
            <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex items-end gap-3">
              <div className="relative" ref={modelPickerRef}>
                <button type="button" onClick={() => setShowModelPicker(!showModelPicker)} className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-purple-600 shadow-inner hover:bg-gray-100 transition-colors">
                  {selectedModel === 'gemini-3-pro-preview' ? <ICONS.Brain className="w-6 h-6" /> : selectedModel === 'gemini-3-flash-preview' ? <ICONS.Zap className="w-6 h-6" /> : <ICONS.Cpu className="w-6 h-6" />}
                </button>
                {showModelPicker && (
                  <div className="absolute bottom-16 left-0 w-80 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl p-2 z-50 space-y-1">
                    <p className="text-[10px] font-black uppercase text-gray-400 px-3 py-1 tracking-widest">Modelos Disponíveis</p>
                    {MODELS.map(m => (
                      <button key={m.id} type="button" onClick={() => { setSelectedModel(m.id); setShowModelPicker(false); }} className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${selectedModel === m.id ? 'bg-purple-600 text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                         <div className={`p-2 rounded-lg ${selectedModel === m.id ? 'bg-purple-500' : 'bg-purple-100 dark:bg-purple-900/30'}`}>{m.id === 'gemini-3-pro-preview' ? <ICONS.Brain className="w-5 h-5" /> : m.id === 'gemini-3-flash-preview' ? <ICONS.Zap className="w-5 h-5" /> : <ICONS.Cpu className="w-5 h-5" />}</div>
                         <div className="text-left">
                           <p className="text-[10px] font-black uppercase tracking-tighter leading-none">{m.name}</p>
                           <p className={`text-[9px] font-medium leading-tight mt-1 ${selectedModel === m.id ? 'text-purple-100' : 'text-gray-400'}`}>{m.description}</p>
                         </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative flex-1 flex items-end bg-gray-50 dark:bg-gray-800 rounded-3xl px-6 py-3 border-2 border-transparent focus-within:border-purple-500 transition-all shadow-inner">
                <textarea value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder={language === 'pt-BR' ? "Escreva sua ideia..." : "Write your idea..."} className="flex-1 bg-transparent outline-none resize-none font-medium text-lg max-h-32 min-h-[40px] placeholder:text-gray-300" rows={1} />
              </div>
              <button type="submit" disabled={!inputValue.trim() || isThinking} className={`w-12 h-12 rounded-2xl shadow-xl transition-all active:scale-90 flex items-center justify-center ${!inputValue.trim() || isThinking ? 'bg-gray-100 text-gray-300' : 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-500/40'}`}><ICONS.Send className="w-6 h-6" /></button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
