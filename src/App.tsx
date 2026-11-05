import { useReferenceMonth } from './hooks/useCalendar';
import { withProjectForecasts } from './lib/projectForecasts';
import { buildInvoiceSettlement, toCents, fromCents } from './lib/finance';
import React, { useState, useEffect, useCallback } from 'react';
import { StorageService, subscribeToStore, initRealtimeSync, ensureCloudProfile } from './lib/storage';
import {
  Account,
  Category,
  Client,
  CreditCard,
  Goal,
  InAppNotification,
  Project,
  RecurringTransaction,
  Transaction,
  TransactionType,
  User,
} from './types';
import { ToastProvider, useToast } from './components/Toast';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { FloatingActionMenu } from './components/FloatingActionButton';
import { MobileMoreDrawer } from './components/MobileMoreDrawer';

// Modals
import { TransactionModal } from './components/modals/TransactionModal';
import { TransferModal } from './components/modals/TransferModal';
import { AITransactionModal } from './components/modals/AITransactionModal';
import { ProjectModal, ProjectDraft } from './components/modals/ProjectModal';
import { ProjectPaymentModal } from './components/modals/ProjectPaymentModal';
import { CreditCardPurchaseModal } from './components/modals/CreditCardPurchaseModal';
import { CreditCardModal } from './components/modals/CreditCardModal';
import { AccountModal } from './components/modals/AccountModal';
import { ClientModal } from './components/modals/ClientModal';
import { GoalModal } from './components/modals/GoalModal';
import { CategoryModal } from './components/modals/CategoryModal';
import { RecurringModal } from './components/modals/RecurringModal';
import { ImportExportModal } from './components/modals/ImportExportModal';
import { GlobalSearchModal } from './components/modals/GlobalSearchModal';
import { NotificationModal } from './components/modals/NotificationModal';
import { ConfirmDeleteModal } from './components/modals/ConfirmDeleteModal';
import { ReminderBanner } from './components/ReminderBanner';
import { IOSNotificationGuideModal } from './components/IOSNotificationGuideModal';
import { checkAndTriggerScheduledReminders } from './lib/notifications';

// Views
import { DashboardView } from './views/DashboardView';
import { TransactionsView } from './views/TransactionsView';
import { PayablesView } from './views/PayablesView';
import { ReceivablesView } from './views/ReceivablesView';
import { AccountsView } from './views/AccountsView';
import { CardsView } from './views/CardsView';
import { ProjectsView } from './views/ProjectsView';
import { ClientsView } from './views/ClientsView';
import { ReportsView } from './views/ReportsView';
import { GoalsView } from './views/GoalsView';
import { ReserveView } from './views/ReserveView';
import { RecurrencesView } from './views/RecurrencesView';
import { CategoriesView } from './views/CategoriesView';
import { SettingsView } from './views/SettingsView';
import { AuthView } from './views/AuthView';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getCurrentMonthYear, getTodayDateString } from './lib/formatters';

function AppContent() {
  const { showToast } = useToast();

  // Core User Session
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [syncGeneration, setSyncGeneration] = useState(0);
  const [authReady, setAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [currentYearMonth, setCurrentYearMonth] = useReferenceMonth();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Loaded Entities from Store
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringList, setRecurringList] = useState<RecurringTransaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalDefaultStatus, setTxModalDefaultStatus] = useState<'completed' | 'pending'>('completed');
  const [txModalDefaultType, setTxModalDefaultType] = useState<TransactionType>('expense');
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [isProjectPaymentModalOpen, setIsProjectPaymentModalOpen] = useState(false);
  const [projectForPayment, setProjectForPayment] = useState<Project | null>(null);

  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<CreditCard | null>(null);
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [recurringToEdit, setRecurringToEdit] = useState<RecurringTransaction | null>(null);

  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isIOSGuideOpen, setIsIOSGuideOpen] = useState(false);

  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);

  // Confirm delete modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Restore only a verified Firebase session (never trust a browser-local login).
  useEffect(() => {
    const fallback = window.setTimeout(() => {
      console.warn('Firebase Authentication did not respond in time. Showing login.');
      setAuthReady(true);
    }, 9000);
    const unsubscribe = onAuthStateChanged(auth, async (session) => {
    if (!session?.emailVerified || !session.email) {
      setCurrentUser(null);
      setAuthReady(true);
      return;
    }
    try {
      const existing = StorageService.getCurrentUser();
      const user = StorageService.login(session.email, existing?.email === session.email ? existing.name : undefined);
      await ensureCloudProfile(user);
      setCurrentUser(user);
    } catch (error) {
      console.error('Cloud authentication failed:', error);
      setCurrentUser(null);
    } finally {
      setAuthReady(true);
    }
    }, (error) => {
      console.error('Firebase Auth initialization failed:', error);
      setAuthReady(true);
    });
    return () => { window.clearTimeout(fallback); unsubscribe(); };
  }, []);

  // Scheduled reminders loop (checks 08:00, 12:00, 20:00 every 30s)
  useEffect(() => {
    if (!currentUser) return;
    const checkReminders = () => {
      checkAndTriggerScheduledReminders(currentUser.id, (title, message) => {
        showToast(`${title}: ${message}`, 'info');
      });
    };
    checkReminders();
    const timer = setInterval(checkReminders, 30000);
    return () => clearInterval(timer);
  }, [currentUser, showToast]);

  // Real-time synchronization with Firestore across all browser instances (Safari / Desktop)
  useEffect(() => {
    if (!currentUser) return;
    const unsubSync = initRealtimeSync(currentUser.id);
    return () => unsubSync();
  }, [currentUser, syncGeneration]);

  // Re-read store data whenever updated
  const refreshData = useCallback(() => {
    if (!currentUser) return;
    const uid = currentUser.id;
    StorageService.ensureInitialDataForUser(uid);
    setAccounts(StorageService.getAccounts(uid));
    setCategories(StorageService.getCategories(uid));
    setCreditCards(StorageService.getCreditCards(uid));
    setClients(StorageService.getClients(uid));
    setProjects(StorageService.getProjects(uid));
    setTransactions(StorageService.getTransactions(uid));
    setRecurringList(StorageService.getRecurring(uid));
    setGoals(StorageService.getGoals(uid));
    setNotifications(StorageService.getNotifications(uid));
  }, [currentUser]);

  useEffect(() => {
    refreshData();
    const unsubscribe = subscribeToStore(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, [refreshData]);

  // Check if demo data exists for indicator
  const hasDemoData = transactions.some((t) => t.isDemo);

  const handleToggleDemoData = () => {
    if (!currentUser) return;
    if (hasDemoData) {
      StorageService.purgeDemoData(currentUser.id);
      showToast('Dados de demonstração removidos com sucesso.', 'info');
    } else {
      StorageService.loadDemoData(currentUser.id);
      showToast('Dados de demonstração (Videomaker) carregados com sucesso!', 'success');
    }
  };

  // Login handler
  const handleLogin = async (email: string, name?: string) => {
    const user = StorageService.login(email, name);
    await ensureCloudProfile(user);
    setCurrentUser(user);
    showToast(`Bem-vindo, ${user.name}!`, 'success');
  };

  const handleLogout = async () => {
    await signOut(auth);
    StorageService.logout();
    setCurrentUser(null);
    showToast('Sessão encerrada com sucesso.', 'info');
  };

  // Save Transaction
  const handleSaveTransaction = (
    txData: Partial<Transaction>,
    recurrenceConfig?: { isRecurring: boolean; periodicity: 'monthly' | 'weekly' | 'yearly'; dueDay: number }
  ) => {
    if (!currentUser) return;
    const isNew = !txData.id;
    let recurrenceId = txData.recurrenceId;
    let recurringToGenerate: RecurringTransaction | undefined;

    // If user marked this transaction to repeat as a recurrence
    if (isNew && recurrenceConfig?.isRecurring && (txData.type === 'income' || txData.type === 'expense')) {
      const recId = recurrenceId || `rec_${Date.now()}`;
      recurrenceId = recId;
      const rec: RecurringTransaction = {
        id: recId,
        userId: currentUser.id,
        type: txData.type,
        description: txData.description || 'Lançamento Recorrente',
        amount: txData.amount || 0,
        periodicity: recurrenceConfig.periodicity || 'monthly',
        dueDay: recurrenceConfig.dueDay || 10,
        categoryId: txData.categoryId || categories[0]?.id,
        accountId: txData.accountId,
        creditCardId: txData.creditCardId,
        paymentMethod: txData.paymentMethod,
        clientId: txData.clientId,
        startDate: txData.date || getTodayDateString(),
        active: true,
        createdAt: new Date().toISOString(),
      };
      recurringToGenerate = rec;
    }

    const tx: Transaction = {
      ...txData,
      id: txData.id || `tx_${Date.now()}`,
      userId: currentUser.id,
      type: txData.type || 'expense',
      description: txData.description || 'Lançamento',
      amount: txData.amount || 0,
      date: txData.date || getTodayDateString(),
      categoryId: txData.categoryId || categories[0]?.id,
      accountId: txData.accountId,
      destinationAccountId: txData.destinationAccountId,
      paymentMethod: txData.paymentMethod || 'pix',
      creditCardId: txData.creditCardId,
      status: txData.status || 'completed',
      clientId: txData.clientId,
      projectId: txData.projectId,
      isRecurring: !!recurrenceConfig?.isRecurring || txData.isRecurring,
      recurrenceId,
      observations: txData.observations,
      createdAt: txData.createdAt || new Date().toISOString(),
    };

    try {
      StorageService.saveTransaction(tx);
      if (recurringToGenerate) StorageService.saveRecurring(recurringToGenerate, true, 6);
    } catch (error) {
      showToast((error as Error).message, 'error');
      return false;
    }
    if (tx.type === 'income') {
      showToast(isNew ? 'Receita adicionada com sucesso.' : 'Receita atualizada com sucesso.', 'success');
    } else if (tx.type === 'expense') {
      showToast(isNew ? 'Despesa registrada com sucesso.' : 'Despesa atualizada com sucesso.', 'success');
    } else {
      showToast('Transferência realizada com sucesso.', 'success');
    }
  };

  // Toggle status of transaction (completed vs pending)
  const handleToggleStatus = (tx: Transaction) => {
    const updatedStatus = tx.status === 'completed' ? 'pending' : 'completed';
    try { StorageService.saveTransaction({ ...tx, status: updatedStatus }); }
    catch (error) { showToast((error as Error).message, 'error'); return; }
    showToast(
      updatedStatus === 'completed'
        ? `${tx.type === 'income' ? 'Receita' : 'Despesa'} marcada como concluída!`
        : 'Lançamento marcado como pendente.',
      'success'
    );
  };

  // Save Project
  const handleSaveProject = (projData: ProjectDraft) => {
    if (!currentUser) return;
    const isNew = !projData.id;
    const proj: Project = {
      id: projData.id || `proj_${Date.now()}`,
      userId: currentUser.id,
      clientId: projData.clientId || clients[0]?.id,
      name: projData.name || 'Novo Projeto',
      description: projData.description,
      totalValue: projData.totalValue || 0,
      projectDate: projData.projectDate || getTodayDateString(),
      paymentDeadline: projData.paymentDeadline || getTodayDateString(),
      status: projData.status || 'in_progress',
      paymentMethod: projData.paymentMethod || 'pix',
      receivedValue: isNew ? 0 : projData.receivedValue || 0,
      pendingValue: fromCents(toCents(projData.totalValue || 0) - toCents(isNew ? 0 : projData.receivedValue || 0)),
      notes: projData.notes,
      createdAt: projData.createdAt || new Date().toISOString(),
    };

    StorageService.saveProject(proj);
    if (isNew && (projData.receivedValue || 0) > 0) {
      StorageService.saveTransaction({
        id: `tx_initial_${proj.id}`, userId: currentUser.id, type: 'income',
        description: `Recebimento inicial: ${proj.name}`, amount: projData.receivedValue!,
        date: proj.projectDate, categoryId: categories.find(c => c.type === 'income')?.id || '',
        accountId: projData.initialPaymentAccountId, paymentMethod: proj.paymentMethod || 'pix',
        clientId: proj.clientId, projectId: proj.id, status: 'completed', createdAt: new Date().toISOString(),
      });
    }
    showToast(isNew ? 'Projeto criado com sucesso!' : 'Projeto atualizado com sucesso.', 'success');
  };

  // Confirm project payment receipt
  const handleConfirmProjectPayment = (data: {
    projectId: string;
    amount: number;
    accountId: string;
    paymentMethod: any;
    date: string;
    description: string;
  }) => {
    if (!currentUser) return;
    const proj = StorageService.getProjects(currentUser.id).find((p) => p.id === data.projectId);
    if (!proj) return;

    if (!Number.isFinite(data.amount) || data.amount <= 0 || toCents(data.amount) > toCents(proj.pendingValue) || !accounts.some(a => a.id === data.accountId)) {
      showToast('Informe uma conta e um valor dentro do saldo pendente.', 'error');
      return;
    }

    // Automatically create income transaction
    const catProjetos =
      categories.find((c) => c.name.toLowerCase().includes('projeto') || c.type === 'income')?.id ||
      categories[0]?.id;

    StorageService.saveTransaction({
      id: `tx_receipt_${Date.now()}`,
      userId: currentUser.id,
      type: 'income',
      description: data.description,
      amount: data.amount,
      date: data.date,
      categoryId: catProjetos,
      accountId: data.accountId,
      paymentMethod: data.paymentMethod,
      clientId: proj.clientId,
      projectId: proj.id,
      status: 'completed',
      createdAt: new Date().toISOString(),
    });

    showToast(`Recebimento de ${proj.name} registrado com sucesso!`, 'success');
  };

  // Save Installments from credit card purchase
  const handleSaveInstallments = (installments: Transaction[]) => {
    try { StorageService.saveTransactionsBulk(installments); }
    catch (error) { showToast((error as Error).message, 'error'); return false; }
    showToast(`Compra parcelada em ${installments.length}x criada com sucesso!`, 'success');
  };

  // Require an explicit payment account and confirmation before recording settlement.
  const handlePayInvoice = (card: CreditCard, amount: number) => {
    if (!currentUser || amount <= 0) return;
    const account = accounts.find(a => a.id === card.paymentAccountId);
    if (!account) {
      setCardToEdit(card); setIsCardModalOpen(true);
      showToast('Defina a conta de pagamento deste cartão antes de quitar a fatura.', 'info');
      return;
    }
    setDeleteConfirm({
      isOpen: true, title: 'Registrar pagamento da fatura',
      message: `Registrar o pagamento da fatura de ${card.name} usando a conta ${account.name}? Esta ação apenas registra a baixa no app.`,
      onConfirm: () => {
        const settlement = buildInvoiceSettlement(card, StorageService.getTransactions(currentUser.id), currentYearMonth, currentUser.id, account.id, getTodayDateString());
        if (!settlement.length) { showToast('Esta fatura já está paga.', 'info'); return; }
        StorageService.saveTransactionsBulk(settlement);
        showToast(`Fatura do cartão ${card.name} paga com sucesso!`, 'success');
      },
    });
  };

  // Post recurring to current active month using storage engine
  const handlePostRecurring = (item: RecurringTransaction) => {
    if (!currentUser) return;
    const res = StorageService.postRecurringToMonth(item.id, currentYearMonth);
    showToast(res.message, res.success ? 'success' : 'info');
  };

  // Quick Add Preset Card (Banco Inter, Mercado Pago, Nubank)
  const handleQuickAddPresetCard = (preset: Partial<CreditCard>) => {
    if (!currentUser) return;
    const newCard: CreditCard = {
      id: `card_${Date.now()}`,
      userId: currentUser.id,
      name: preset.name || 'Novo Cartão',
      institution: preset.institution || 'Banco',
      limit: preset.limit || 5000,
      closingDay: preset.closingDay || 10,
      dueDay: preset.dueDay || 17,
      color: preset.color || '#ff7a00',
      createdAt: new Date().toISOString(),
    };
    StorageService.saveCreditCard(newCard);
    showToast(`Cartão ${newCard.name} adicionado com sucesso!`, 'success');
  };

  // Recurring Handlers
  const handleSaveRecurring = (item: Partial<RecurringTransaction>, generateOccurrences: boolean) => {
    if (!currentUser) return;
    const isNew = !item.id;
    const rec: RecurringTransaction = {
      id: item.id || `rec_${Date.now()}`,
      userId: currentUser.id,
      type: item.type || 'expense',
      description: item.description || 'Recorrência',
      amount: item.amount || 0,
      periodicity: item.periodicity || 'monthly',
      dueDay: item.dueDay || 10,
      categoryId: item.categoryId || categories[0]?.id,
      accountId: item.accountId,
      creditCardId: item.creditCardId,
      paymentMethod: item.paymentMethod,
      clientId: item.clientId,
      startDate: item.startDate || getTodayDateString(),
      endDate: item.endDate,
      active: item.active ?? true,
      createdAt: item.createdAt || new Date().toISOString(),
    };
    StorageService.saveRecurring(rec, generateOccurrences, 6);
    showToast(
      isNew
        ? 'Recorrência cadastrada com sucesso! As previsões foram geradas.'
        : 'Recorrência atualizada com sucesso!',
      'success'
    );
  };

  const handleToggleRecurringActive = (id: string) => {
    StorageService.toggleRecurringActive(id);
    showToast('Status da recorrência atualizado com sucesso.', 'info');
  };

  const handleSyncAllRecurrences = () => {
    if (!currentUser) return;
    StorageService.syncAllRecurrences(currentUser.id, 6);
    showToast('Lançamentos futuros sincronizados para os próximos 6 meses!', 'success');
  };

  // Goals deposit
  const handleDepositGoal = (goalId: string, amount: number) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const updated = {
      ...goal,
      currentValue: goal.currentValue + amount,
    };
    StorageService.saveGoal(updated);
    showToast(`Aporte de R$ ${amount.toFixed(2)} adicionado à meta!`, 'success');
  };

  if (!authReady) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 text-center">Carregando o Yan Financeiro... Se demorar, a tela de login será exibida automaticamente.</div>;

  // If user is not logged in, render AuthView
  if (!currentUser) {
    return <AuthView onLoginSuccess={handleLogin} />;
  }

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex flex-1 min-h-screen">
        {/* Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          user={currentUser}
          onLogout={handleLogout}
          hasDemoData={hasDemoData}
          onToggleDemoData={handleToggleDemoData}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
          {/* Top Navbar */}
          <Navbar
            user={currentUser}
            currentYearMonth={currentYearMonth}
            onChangeMonth={setCurrentYearMonth}
            onOpenSearch={() => setIsSearchModalOpen(true)}
            onOpenNotifications={() => setIsNotificationModalOpen(true)}
            notifications={notifications}
            onOpenQuickAdd={() => {
              setTxToEdit(null);
                  setTxModalDefaultStatus('completed');
              setTxModalDefaultType('expense');
              setIsTxModalOpen(true);
            }}
            onOpenAIModal={() => setIsAIModalOpen(true)}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          />

          {/* Tab Views */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {/* Mobile / Scheduled Reminder Banner (08h, 12h, 20h) */}
            <ReminderBanner
              onOpenSettings={() => setActiveTab('settings')}
              onOpenIOSGuide={() => setIsIOSGuideOpen(true)}
              userId={currentUser.id}
            />

            {activeTab === 'dashboard' && (
              <DashboardView
                currentYearMonth={currentYearMonth}
                transactions={withProjectForecasts(transactions, projects)}
                accounts={accounts}
                categories={categories}
                creditCards={creditCards}
                clients={clients}
                projects={projects}
                onOpenNewTransaction={(type) => {
                  setTxToEdit(null);
                  setTxModalDefaultStatus('completed');
                  setTxModalDefaultType(type || 'expense');
                  setIsTxModalOpen(true);
                }}
                onOpenNewTransfer={() => setIsTransferModalOpen(true)}
                onOpenAIModal={() => setIsAIModalOpen(true)}
                onSelectTransaction={(tx) => {
                  setTxToEdit(tx);
                  setIsTxModalOpen(true);
                }}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsView
                currentYearMonth={currentYearMonth}
                transactions={transactions}
                categories={categories}
                accounts={accounts}
                creditCards={creditCards}
                clients={clients}
                projects={projects}
                onOpenNewTransaction={(type) => {
                  setTxToEdit(null);
                  setTxModalDefaultStatus('completed');
                  setTxModalDefaultType(type || 'expense');
                  setIsTxModalOpen(true);
                }}
                onEditTransaction={(tx) => {
                  setTxToEdit(tx);
                  setIsTxModalOpen(true);
                }}
                onDeleteTransaction={(id) => {
                  setDeleteConfirm({
                    isOpen: true,
                    title: 'Excluir Lançamento',
                    message: 'Tem certeza de que deseja excluir este lançamento financeiro?',
                    onConfirm: () => {
                      StorageService.deleteTransaction(id);
                      showToast('Lançamento excluído com sucesso.', 'info');
                    },
                  });
                }}
                onToggleStatus={handleToggleStatus}
              />
            )}

            {activeTab === 'payables' && (
              <PayablesView
                transactions={transactions}
                categories={categories}
                accounts={accounts}
                onOpenNewExpense={() => {
                  setTxToEdit(null);
                  setTxModalDefaultStatus('pending');
                  setTxModalDefaultType('expense');
                  setIsTxModalOpen(true);
                }}
                onMarkAsPaid={(tx) => handleToggleStatus(tx)}
                onEditTransaction={(tx) => {
                  setTxToEdit(tx);
                  setIsTxModalOpen(true);
                }}
              />
            )}

            {activeTab === 'receivables' && (
              <ReceivablesView
                transactions={withProjectForecasts(transactions, projects)}
                clients={clients}
                projects={projects}
                accounts={accounts}
                onOpenNewIncome={() => {
                  setTxToEdit(null);
                  setTxModalDefaultStatus('pending');
                  setTxModalDefaultType('income');
                  setIsTxModalOpen(true);
                }}
                onMarkAsReceived={(tx) => {
                  if (tx.isProjectForecast) {
                    const project = projects.find(p => p.id === tx.projectId);
                    if (project) { setProjectForPayment(project); setIsProjectPaymentModalOpen(true); }
                  } else handleToggleStatus(tx);
                }}
              />
            )}

            {activeTab === 'accounts' && (
              <AccountsView
                accounts={accounts}
                transactions={transactions}
                onOpenNewAccount={() => {
                  setAccountToEdit(null);
                  setIsAccountModalOpen(true);
                }}
                onEditAccount={(acc) => {
                  setAccountToEdit(acc);
                  setIsAccountModalOpen(true);
                }}
                onDeleteAccount={(accId) => {
                  setDeleteConfirm({
                    isOpen: true,
                    title: 'Excluir Conta',
                    message: 'Deseja excluir esta conta bancária?',
                    onConfirm: () => {
                      StorageService.deleteAccount(accId);
                      showToast('Conta excluída com sucesso.', 'info');
                    },
                  });
                }}
                onOpenTransferModal={() => setIsTransferModalOpen(true)}
              />
            )}

            {activeTab === 'cards' && (
              <CardsView
                creditCards={creditCards}
                transactions={transactions}
                currentYearMonth={currentYearMonth}
                onOpenNewCard={() => {
                  setCardToEdit(null);
                  setIsCardModalOpen(true);
                }}
                onEditCard={(card) => {
                  setCardToEdit(card);
                  setIsCardModalOpen(true);
                }}
                onDeleteCard={(cardId) => {
                  setDeleteConfirm({
                    isOpen: true,
                    title: 'Excluir Cartão',
                    message: 'Tem certeza de que deseja remover este cartão de crédito?',
                    onConfirm: () => {
                      StorageService.deleteCreditCard(cardId);
                      showToast('Cartão excluído com sucesso.', 'info');
                    },
                  });
                }}
                onOpenInstallmentPurchase={() => setIsInstallmentModalOpen(true)}
                onPayInvoice={handlePayInvoice}
                onQuickAddPresetCard={handleQuickAddPresetCard}
              />
            )}

            {activeTab === 'projects' && (
              <ProjectsView
                projects={projects}
                clients={clients}
                onOpenNewProject={() => {
                  setProjectToEdit(null);
                  setIsProjectModalOpen(true);
                }}
                onEditProject={(proj) => {
                  setProjectToEdit(proj);
                  setIsProjectModalOpen(true);
                }}
                onDeleteProject={(projId) => {
                  setDeleteConfirm({
                    isOpen: true,
                    title: 'Excluir Projeto',
                    message: 'Deseja excluir este projeto audiovisual?',
                    onConfirm: () => {
                      StorageService.deleteProject(projId);
                      showToast('Projeto excluído com sucesso.', 'info');
                    },
                  });
                }}
                onOpenPaymentModal={(proj) => {
                  setProjectForPayment(proj);
                  setIsProjectPaymentModalOpen(true);
                }}
              />
            )}

            {activeTab === 'clients' && (
              <ClientsView
                clients={clients}
                projects={projects}
                transactions={transactions}
                onOpenNewClient={() => {
                  setClientToEdit(null);
                  setIsClientModalOpen(true);
                }}
                onEditClient={(client) => {
                  setClientToEdit(client);
                  setIsClientModalOpen(true);
                }}
                onDeleteClient={(clientId) => {
                  setDeleteConfirm({
                    isOpen: true,
                    title: 'Excluir Cliente',
                    message: 'Deseja excluir o registro deste cliente?',
                    onConfirm: () => {
                      StorageService.deleteClient(clientId);
                      showToast('Cliente excluído com sucesso.', 'info');
                    },
                  });
                }}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                currentYearMonth={currentYearMonth}
                transactions={withProjectForecasts(transactions, projects)}
                categories={categories}
                clients={clients}
                projects={projects}
                onOpenExportModal={() => setIsImportExportModalOpen(true)}
              />
            )}

            {activeTab === 'goals' && (
              <GoalsView
                goals={goals}
                accounts={accounts}
                onOpenNewGoal={() => {
                  setGoalToEdit(null);
                  setIsGoalModalOpen(true);
                }}
                onEditGoal={(goal) => {
                  setGoalToEdit(goal);
                  setIsGoalModalOpen(true);
                }}
                onDeleteGoal={(goalId) => {
                  setDeleteConfirm({
                    isOpen: true,
                    title: 'Excluir Meta',
                    message: 'Deseja remover esta meta financeira?',
                    onConfirm: () => {
                      StorageService.deleteGoal(goalId);
                      showToast('Meta excluída com sucesso.', 'info');
                    },
                  });
                }}
                onDepositGoal={handleDepositGoal}
              />
            )}

            {activeTab === 'reserve' && (
              <ReserveView transactions={transactions} accounts={accounts} />
            )}

            {activeTab === 'recurring' && (
              <RecurrencesView
                recurringList={recurringList}
                categories={categories}
                accounts={accounts}
                creditCards={creditCards}
                clients={clients}
                transactions={transactions}
                currentYearMonth={currentYearMonth}
                onOpenNewRecurring={() => {
                  setRecurringToEdit(null);
                  setIsRecurringModalOpen(true);
                }}
                onEditRecurring={(item) => {
                  setRecurringToEdit(item);
                  setIsRecurringModalOpen(true);
                }}
                onDeleteRecurring={(id) => {
                  setDeleteConfirm({
                    isOpen: true,
                    title: 'Excluir Recorrência',
                    message:
                      'Deseja excluir esta recorrência e remover os lançamentos pendentes futuros associados a ela?',
                    onConfirm: () => {
                      StorageService.deleteRecurring(id, true);
                      showToast('Recorrência e previsões futuras removidas.', 'info');
                    },
                  });
                }}
                onToggleActive={handleToggleRecurringActive}
                onPostRecurringToMonth={handlePostRecurring}
                onSyncAllRecurrences={handleSyncAllRecurrences}
                onToggleTransactionStatus={handleToggleStatus}
              />
            )}

            {activeTab === 'categories' && (
              <CategoriesView
                categories={categories}
                onOpenNewCategory={() => {
                  setCategoryToEdit(null);
                  setIsCategoryModalOpen(true);
                }}
                onEditCategory={(cat) => {
                  setCategoryToEdit(cat);
                  setIsCategoryModalOpen(true);
                }}
                onDeleteCategory={(catId) => {
                  setDeleteConfirm({
                    isOpen: true,
                    title: 'Excluir Categoria',
                    message: 'Deseja excluir esta categoria financeira?',
                    onConfirm: () => {
                      StorageService.deleteCategory(catId);
                      showToast('Categoria excluída.', 'info');
                    },
                  });
                }}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                user={currentUser}
                onUpdateUser={(updated) => {
                  const newUser = { ...currentUser, ...updated };
                  StorageService.saveUser(newUser);
                  setCurrentUser(newUser);
                }}
                isDarkMode={isDarkMode}
                onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                hasDemoData={hasDemoData}
                onToggleDemoData={handleToggleDemoData}
                onResetAllData={() => {
                  setDeleteConfirm({
                    isOpen: true,
                    title: 'Zerar lançamentos e saldos',
                    message: 'Apagar todos os lançamentos, parcelas, recorrências e avisos desta conta, zerar saldos iniciais e o histórico de recebimentos dos projetos? Contas, cartões, clientes, categorias, valores contratados dos projetos e metas serão mantidos. Esta ação não pode ser desfeita.',
                    onConfirm: async () => {
                      await StorageService.resetAll();
                      setSyncGeneration(n => n + 1);
                      refreshData();
                      showToast('Lançamentos e saldos zerados no navegador e na nuvem.', 'success');
                    },
                  });
                }}
                onOpenIOSGuide={() => setIsIOSGuideOpen(true)}
              />
            )}
          </main>
        </div>
      </div>

      {/* Mobile Native Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenQuickMenu={() => setIsQuickMenuOpen(true)}
        onOpenMoreDrawer={() => setIsMoreDrawerOpen(true)}
      />

      {/* Speed Dial Action Sheet */}
      <FloatingActionMenu
        isOpen={isQuickMenuOpen}
        onClose={() => setIsQuickMenuOpen(false)}
        onNewIncome={() => {
          setTxToEdit(null);
                  setTxModalDefaultStatus('completed');
          setTxModalDefaultType('income');
          setIsTxModalOpen(true);
        }}
        onNewExpense={() => {
          setTxToEdit(null);
                  setTxModalDefaultStatus('completed');
          setTxModalDefaultType('expense');
          setIsTxModalOpen(true);
        }}
        onNewTransfer={() => setIsTransferModalOpen(true)}
        onNewWithAI={() => setIsAIModalOpen(true)}
      />

      {/* Mobile "Mais" Drawer */}
      <MobileMoreDrawer
        isOpen={isMoreDrawerOpen}
        onClose={() => setIsMoreDrawerOpen(false)}
        onSelectTab={setActiveTab}
        onOpenImportExport={() => setIsImportExportModalOpen(true)}
        user={currentUser}
        onLogout={handleLogout}
        hasDemoData={hasDemoData}
        onToggleDemoData={handleToggleDemoData}
        onOpenIOSGuide={() => setIsIOSGuideOpen(true)}
      />

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTransaction}
        transactionToEdit={txToEdit}
        defaultType={txModalDefaultType}
        defaultStatus={txModalDefaultStatus}
        accounts={accounts}
        categories={categories}
        creditCards={creditCards}
        clients={clients}
        projects={projects}
      />

      {isTransferModalOpen && (
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSave={handleSaveTransaction}
        accounts={accounts}
      />
      )}

      <AITransactionModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onConfirmSave={handleSaveTransaction}
        onEditInForm={(parsed) => {
          setTxToEdit(parsed as Transaction);
          setTxModalDefaultType(parsed.type || 'expense');
          setIsTxModalOpen(true);
        }}
        categories={categories}
        accounts={accounts}
        creditCards={creditCards}
        clients={clients}
        projects={projects}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleSaveProject}
        accounts={accounts}
        projectToEdit={projectToEdit}
        clients={clients}
      />

      {isProjectPaymentModalOpen && (
      <ProjectPaymentModal
        isOpen={isProjectPaymentModalOpen}
        onClose={() => setIsProjectPaymentModalOpen(false)}
        project={projectForPayment}
        accounts={accounts}
        onConfirmPayment={handleConfirmProjectPayment}
      />
      )}

      {isInstallmentModalOpen && (
      <CreditCardPurchaseModal
        isOpen={isInstallmentModalOpen}
        onClose={() => setIsInstallmentModalOpen(false)}
        creditCards={creditCards}
        categories={categories}
        onSaveInstallments={handleSaveInstallments}
        userId={currentUser.id}
      />
      )}

      <CreditCardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        onSave={(c) => {
          StorageService.saveCreditCard(c as CreditCard);
          showToast('Cartão salvo com sucesso!', 'success');
        }}
        cardToEdit={cardToEdit}
        accounts={accounts}
        userId={currentUser.id}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSave={(acc) => {
          StorageService.saveAccount(acc as Account);
          showToast('Conta salva com sucesso!', 'success');
        }}
        accountToEdit={accountToEdit}
        userId={currentUser.id}
      />

      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={(client) => {
          const clientId = client.id || `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
          StorageService.saveClient({ ...(client as Client), id: clientId });
          showToast('Cliente salvo com sucesso!', 'success');
        }}
        clientToEdit={clientToEdit}
        userId={currentUser.id}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={(goal) => {
          StorageService.saveGoal(goal as Goal);
          showToast('Meta salva com sucesso!', 'success');
        }}
        goalToEdit={goalToEdit}
        accounts={accounts}
        userId={currentUser.id}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={(cat) => {
          StorageService.saveCategory(cat as Category);
          showToast('Categoria salva com sucesso!', 'success');
        }}
        categoryToEdit={categoryToEdit}
        userId={currentUser.id}
      />

      <RecurringModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        onSave={handleSaveRecurring}
        recurringToEdit={recurringToEdit}
        categories={categories}
        accounts={accounts}
        creditCards={creditCards}
        clients={clients}
        userId={currentUser.id}
      />

      <ImportExportModal
        isOpen={isImportExportModalOpen}
        onClose={() => setIsImportExportModalOpen(false)}
        transactions={transactions}
        categories={categories}
        accounts={accounts}
        onImportTransactions={(imported) => {
          StorageService.saveTransactionsBulk(imported, true);
          showToast(`${imported.length} lançamentos importados com sucesso!`, 'success');
        }}
        userId={currentUser.id}
      />

      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        transactions={transactions}
        clients={clients}
        projects={projects}
        accounts={accounts}
        creditCards={creditCards}
        categories={categories}
        onSelectTransaction={(tx) => {
          setTxToEdit(tx);
          setIsTxModalOpen(true);
        }}
        onSelectProject={(proj) => {
          setProjectToEdit(proj);
          setIsProjectModalOpen(true);
        }}
        onSelectClient={(c) => {
          setActiveTab('clients');
        }}
      />

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={notifications}
        onMarkAsRead={(id) => StorageService.markNotificationRead(id)}
        onMarkAllAsRead={() => StorageService.markAllNotificationsRead(currentUser.id)}
        onNavigateTab={(tab) => setActiveTab(tab as ActiveTab)}
      />

      <ConfirmDeleteModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirm.onConfirm}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
      />

      <IOSNotificationGuideModal
        isOpen={isIOSGuideOpen}
        onClose={() => setIsIOSGuideOpen(false)}
        userId={currentUser.id}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
