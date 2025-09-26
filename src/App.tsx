import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Users, Upload, CheckCircle, AlertCircle, Car, User, Building, Calendar, Lock, Archive, Trash2
} from 'lucide-react';

// --- Interfaces ---
interface Document {
  id: string;
  type: string;
  name: string;
  file: File;
  uploadDate: Date;
  month: number;
  year: number;
}

interface ClientData {
  firstName: string;
  lastName: string;
  businessType: 'taxi' | 'vtc';
  documents: Document[];
  selectedMonth: number;
  selectedYear: number;
}

interface YearStatus {
  year: number;
  isClosed: boolean;
  closedDate?: Date;
}

interface AdminAuth {
  isAuthenticated: boolean;
  password: string;
}

// --- Constantes ---
const documentTypes = {
  common: {
    'facture_achat_vehicule': 'Facture achat véhicule',
    'feuille_amortissement': 'Feuille amortissement',
    'releve_bancaire': 'Relevé bancaire',
    'essence_recharges': 'Essence/Recharges',
    'entretien_courant': 'Entretien courant',
    'assurances': 'Assurances',
    'entretien_reparations': 'Entretien/Réparations',
    'peages': 'Péages',
    'telephone_pro': 'Téléphone pro',
    'autres': 'Autres'
  },
  taxi: {
    'taxe_stationnement': 'Taxe de stationnement',
    'location_licence': 'Location licence',
    'location_vehicule_licence': 'Location véhicule + licence',
    'abonnement_g7': 'Abonnement G7',
    'mise_a_jour_taximetre': 'Mise à jour taximètre'
  },
  vtc: {
    'location_vehicule_vtc': 'Location véhicule VTC',
    'abonnement_plateformes_vtc': 'Abonnement plateformes VTC'
  }
};

const months = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const ADMIN_PASSWORD = 'admin2024';

// --- Fonctions de stockage ---
const saveDataToLocalStorage = (clients: ClientData[], yearStatuses: YearStatus[]) => {
  localStorage.setItem('clients', JSON.stringify(clients));
  localStorage.setItem('yearStatuses', JSON.stringify(yearStatuses));
};

const loadDataFromLocalStorage = (): { clients: ClientData[]; yearStatuses: YearStatus[] } => {
  const clients = localStorage.getItem('clients');
  const yearStatuses = localStorage.getItem('yearStatuses');
  return {
    clients: clients ? JSON.parse(clients) : [],
    yearStatuses: yearStatuses ? JSON.parse(yearStatuses) : [],
  };
};

// --- Composant Principal ---
function App() {
  // Chargement initial des données depuis localStorage
  const initialData = loadDataFromLocalStorage();

  const [currentView, setCurrentView] = useState<'home' | 'client' | 'admin'>('home');
  const [clients, setClients] = useState<ClientData[]>(initialData.clients);
  const [yearStatuses, setYearStatuses] = useState<YearStatus[]>(initialData.yearStatuses);
  const [adminAuth, setAdminAuth] = useState<AdminAuth>({ isAuthenticated: false, password: '' });
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordError, setShowPasswordError] = useState(false);

  // refs pour inputs nom/prénom — uncontrolled inputs pour une frappe fluide
  const firstNameRef = useRef<HTMLInputElement | null>(null);
  const lastNameRef = useRef<HTMLInputElement | null>(null);

  const [currentClient, setCurrentClient] = useState<ClientData>({
    firstName: '',
    lastName: '',
    businessType: 'taxi',
    documents: [],
    selectedMonth: new Date().getMonth() + 1,
    selectedYear: new Date().getFullYear()
  });

  // Sauvegarde automatique des données à chaque modification
  useEffect(() => {
    saveDataToLocalStorage(clients, yearStatuses);
  }, [clients, yearStatuses]);

  const getCurrentYears = () => {
    const startYear = 2020;
    const endYear = 2050;
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
  };

  const handleAdminLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setAdminAuth({ isAuthenticated: true, password: passwordInput });
      setPasswordInput('');
      setShowPasswordError(false);
    } else {
      setShowPasswordError(true);
      setTimeout(() => setShowPasswordError(false), 3000);
    }
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdminLogin();
    }
  };

  const handleFirstNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      lastNameRef.current?.focus();
    }
  };

  const handleLastNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyRefsToCurrentClient();
      handleSubmitClient();
    }
  };

  // lit les valeurs des refs et les applique dans currentClient
  const applyRefsToCurrentClient = () => {
    const fn = firstNameRef.current?.value.trim() || '';
    const ln = lastNameRef.current?.value.trim() || '';
    setCurrentClient(prev => ({ ...prev, firstName: fn, lastName: ln }));
  };

  // lookup au onBlur pour ne jamais bloquer la frappe
  const lookupExistingClient = () => {
    const fn = firstNameRef.current?.value.trim() || '';
    const ln = lastNameRef.current?.value.trim() || '';
    if (!fn || !ln) return;
    const existingClient = clients.find(c => c.firstName === fn && c.lastName === ln);
    if (existingClient) {
      // on merge les métadonnées (businessType, documents) sans toucher à la saisie en cours
      setCurrentClient(prev => ({
        ...prev,
        firstName: fn,
        lastName: ln,
        businessType: existingClient.businessType,
        documents: existingClient.documents,
      }));
      // Optionnel: on met à jour les inputs affichés (après blur — pas gênant)
      if (firstNameRef.current) firstNameRef.current.value = existingClient.firstName;
      if (lastNameRef.current) lastNameRef.current.value = existingClient.lastName;
    } else {
      setCurrentClient(prev => ({ ...prev, firstName: fn, lastName: ln }));
    }
  };

  const handleAdminLogout = () => {
    setAdminAuth({ isAuthenticated: false, password: '' });
    setCurrentView('home');
  };

  const isYearClosed = (year: number) => {
    return yearStatuses.find(status => status.year === year)?.isClosed || false;
  };

  const closeYear = (year: number) => {
    setYearStatuses(prev => {
      const existing = prev.find(status => status.year === year);
      if (existing) {
        return prev.map(status =>
          status.year === year
            ? { ...status, isClosed: true, closedDate: new Date() }
            : status
        );
      } else {
        return [...prev, { year, isClosed: true, closedDate: new Date() }];
      }
    });
  };

  const reopenYear = (year: number) => {
    setYearStatuses(prev =>
      prev.map(status =>
        status.year === year
          ? { ...status, isClosed: false, closedDate: undefined }
          : status
      )
    );
  };

  const handleFileUpload = (type: string, file: File) => {
    if (isYearClosed(currentClient.selectedYear)) {
      alert('Impossible de téléverser des documents pour une année clôturée.');
      return;
    }
    const newDocument: Document = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      name: file.name,
      file,
      uploadDate: new Date(),
      month: currentClient.selectedMonth,
      year: currentClient.selectedYear
    };
    setCurrentClient(prev => ({
      ...prev,
      documents: [...prev.documents, newDocument]
    }));
  };

  const handleSubmitClient = () => {
    const fn = firstNameRef.current?.value.trim() || '';
    const ln = lastNameRef.current?.value.trim() || '';
    if (!fn || !ln) {
      alert('Veuillez saisir le prénom et le nom.');
      return;
    }

    const clientToSave: ClientData = {
      ...currentClient,
      firstName: fn,
      lastName: ln
    };

    setClients(prev => {
      const existingIndex = prev.findIndex(
        c => c.firstName === clientToSave.firstName && c.lastName === clientToSave.lastName
      );
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = { ...clientToSave };
        return updated;
      } else {
        return [...prev, { ...clientToSave }];
      }
    });

    // reset currentClient and clear inputs
    setCurrentClient({
      firstName: '',
      lastName: '',
      businessType: 'taxi',
      documents: [],
      selectedMonth: new Date().getMonth() + 1,
      selectedYear: new Date().getFullYear()
    });
    if (firstNameRef.current) firstNameRef.current.value = '';
    if (lastNameRef.current) lastNameRef.current.value = '';

    alert('Dossier soumis avec succès !');
  };

  const getAvailableDocuments = () => {
    const specificTypes = currentClient.businessType === 'taxi'
      ? documentTypes.taxi
      : documentTypes.vtc;
    return { ...documentTypes.common, ...specificTypes };
  };

  const getDocumentsForMonth = (documents: Document[], month: number, year: number) => {
    return documents.filter(doc => doc.month === month && doc.year === year);
  };

  const getClientDocumentsByYear = (client: ClientData) => {
    const documentsByYear: { [year: number]: { [month: number]: Document[] } } = {};
    client.documents.forEach(doc => {
      if (!documentsByYear[doc.year]) {
        documentsByYear[doc.year] = {};
      }
      if (!documentsByYear[doc.year][doc.month]) {
        documentsByYear[doc.year][doc.month] = [];
      }
      documentsByYear[doc.year][doc.month].push(doc);
    });
    return documentsByYear;
  };

  const downloadAllClientDocuments = (client: ClientData) => {
    client.documents.forEach((doc) => {
      const url = URL.createObjectURL(doc.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const deleteClient = (clientIndex: number) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ce client ?`)) {
      setClients(prev => prev.filter((_, index) => index !== clientIndex));
    }
  };

  // --- Vues ---
  const HomeView = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Car className="h-16 w-16 text-blue-600 mr-4" />
            <h1 className="text-5xl font-bold text-gray-900">JMComptabilite</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Plateforme de gestion comptable dédiée aux professionnels du transport.
            Gestion mensuelle et clôture annuelle des documents comptables.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div
            onClick={() => setCurrentView('client')}
            className="bg-white rounded-xl shadow-lg p-8 cursor-pointer transform hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex items-center mb-6">
              <Upload className="h-12 w-12 text-blue-600 mr-4" />
              <h3 className="text-2xl font-bold text-gray-900">Espace Client</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Déposez vos documents comptables par mois et par année. Interface dédiée aux chauffeurs de taxi et VTC.
            </p>
            <div className="flex items-center text-blue-600 font-semibold">
              <span>Accéder →</span>
            </div>
          </div>
          <div
            onClick={() => setCurrentView('admin')}
            className="bg-white rounded-xl shadow-lg p-8 cursor-pointer transform hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-green-500"
          >
            <div className="flex items-center mb-6">
              <Building className="h-12 w-12 text-green-600 mr-4" />
              <h3 className="text-2xl font-bold text-gray-900">Espace Admin</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Interface de gestion pour les comptables. Vérification des dossiers et clôture annuelle.
            </p>
            <div className="flex items-center text-green-600 font-semibold">
              <span>Accéder →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const AdminLoginView = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Lock className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Accès Administrateur</h2>
          <p className="text-gray-600 mt-2">Veuillez saisir le mot de passe</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={handlePasswordKeyDown}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Saisissez le mot de passe"
              autoFocus
            />
          </div>
          {showPasswordError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800 text-sm">Mot de passe incorrect</span>
              </div>
            </div>
          )}
          <div className="flex space-x-3">
            <button
              onClick={() => setCurrentView('home')}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleAdminLogin}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ClientView = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <button
          onClick={() => setCurrentView('home')}
          className="text-blue-600 hover:text-blue-800 font-semibold"
        >
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Espace Client</h1>
      </div>
    </div>
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Informations client */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-6">
            <User className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Informations personnelles</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
              <input
                ref={firstNameRef}
                type="text"
                defaultValue={currentClient.firstName}
                onKeyDown={handleFirstNameKeyDown}
                onBlur={lookupExistingClient}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Votre prénom"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
              <input
                ref={lastNameRef}
                type="text"
                defaultValue={currentClient.lastName}
                onKeyDown={handleLastNameKeyDown}
                onBlur={lookupExistingClient}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Votre nom"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type d'activité</label>
              <select
                value={currentClient.businessType}
                onChange={(e) => setCurrentClient(prev => ({ ...prev, businessType: e.target.value as 'taxi' | 'vtc' }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="taxi">Taxi</option>
                <option value="vtc">VTC</option>
              </select>
            </div>
          </div>
        </div>
        {/* Sélection période */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-6">
            <Calendar className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Période de dépôt</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mois</label>
              <select
                value={currentClient.selectedMonth}
                onChange={(e) => setCurrentClient(prev => ({ ...prev, selectedMonth: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {months.map((month, index) => (
                  <option key={index} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Année</label>
              <select
                value={currentClient.selectedYear}
                onChange={(e) => setCurrentClient(prev => ({ ...prev, selectedYear: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {getCurrentYears().map(year => (
                  <option key={year} value={year}>
                    {year} {isYearClosed(year) && '(Clôturée)'}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {isYearClosed(currentClient.selectedYear) && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <Lock className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800 font-medium">
                  L'année {currentClient.selectedYear} est clôturée. Aucun nouveau document ne peut être ajouté.
                </span>
              </div>
            </div>
          )}
        </div>
        {/* Documents */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <FileText className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Documents - {months[currentClient.selectedMonth - 1]} {currentClient.selectedYear} - {currentClient.businessType.toUpperCase()}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(getAvailableDocuments()).map(([key, label]) => {
              const monthDocuments = getDocumentsForMonth(
                currentClient.documents,
                currentClient.selectedMonth,
                currentClient.selectedYear
              );
              const hasDocument = monthDocuments.some(doc => doc.type === key);
              return (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{label}</h3>
                    {hasDocument && <CheckCircle className="h-5 w-5 text-green-600" />}
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    disabled={isYearClosed(currentClient.selectedYear)}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(key, file);
                    }}
                    className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                  />
                  {/* Affichage des fichiers téléversés avec message vert */}
                  {monthDocuments
                    .filter(doc => doc.type === key)
                    .map(doc => (
                      <div key={doc.id} className="mt-2 text-sm text-green-600">
                        ✓ {doc.name} téléversé pour {months[doc.month - 1]} {doc.year}
                      </div>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <button
              onClick={handleSubmitClient}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Soumettre le dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

  const AdminView = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView('home')}
              className="text-green-600 hover:text-green-800 font-semibold"
            >
              ← Retour
            </button>
            <span className="text-sm text-gray-600">
              Connecté en tant qu'administrateur
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Interface Administrateur</h1>
          <button
            onClick={handleAdminLogout}
            className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        {/* Gestion des années */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-6">
            <Archive className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Gestion des années comptables</h2>
          </div>
          <div className="grid md:grid-cols-6 gap-4 max-h-96 overflow-y-auto">
            {getCurrentYears().map(year => {
              const yearStatus = yearStatuses.find(status => status.year === year);
              const isClosed = yearStatus?.isClosed || false;
              return (
                <div key={year} className={`p-4 rounded-lg border-2 ${
                  isClosed ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'
                }`}>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{year}</h3>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3 ${
                      isClosed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {isClosed ? (
                        <>
                          <Lock className="h-4 w-4 mr-1" />
                          Clôturée
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Ouverte
                        </>
                      )}
                    </div>
                    {isClosed ? (
                      <div>
                        <p className="text-xs text-gray-600 mb-2">
                          Clôturée le {yearStatus?.closedDate?.toLocaleDateString('fr-FR')}
                        </p>
                        <button
                          onClick={() => reopenYear(year)}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          Rouvrir
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => closeYear(year)}
                        className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Clôturer
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Dossiers clients */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Users className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Dossiers clients ({clients.length})
            </h2>
          </div>
        </div>
        {clients.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun dossier</h3>
            <p className="text-gray-500">Les dossiers soumis par les clients apparaîtront ici.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {clients.map((client, index) => {
              const documentsByYear = getClientDocumentsByYear(client);
              return (
                <div key={index} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {client.firstName} {client.lastName}
                      </h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        client.businessType === 'taxi'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {client.businessType.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total documents: {client.documents.length}</p>
                    </div>
                  </div>
                  {/* Documents par année */}
                  {Object.entries(documentsByYear).map(([year, monthsData]) => (
                    <div key={year} className="mb-6">
                      <div className="flex items-center mb-4">
                        <h4 className="text-lg font-semibold text-gray-800 mr-3">Année {year}</h4>
                        {isYearClosed(parseInt(year)) && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <Lock className="h-3 w-3 mr-1" />
                            Clôturée
                          </span>
                        )}
                      </div>
                      <div className="grid md:grid-cols-12 gap-2 mb-4">
                        {months.map((monthName, monthIndex) => {
                          const monthNumber = monthIndex + 1;
                          const monthDocs = monthsData[monthNumber] || [];
                          const hasDocuments = monthDocs.length > 0;
                          return (
                            <div
                              key={monthIndex}
                              className={`p-2 rounded text-center text-xs ${
                                hasDocuments
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              <div className="font-medium">{monthName.slice(0, 3)}</div>
                              <div>{monthDocs.length}</div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Documents détaillés pour l'année */}
                      <div className="grid md:grid-cols-3 gap-4">
                        {Object.entries(monthsData).map(([month, docs]) => (
                          <div key={month} className="border border-gray-200 rounded-lg p-3">
                            <h5 className="font-medium text-gray-900 mb-2">
                              {months[parseInt(month) - 1]} {year}
                            </h5>
                            {docs.map((doc) => (
                              <div key={doc.id} className="flex items-center p-2 bg-gray-50 rounded mb-2">
                                <FileText className="h-4 w-4 text-gray-600 mr-2" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900 truncate">
                                    {getAvailableDocuments()[doc.type as keyof typeof documentTypes.common]}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">{doc.name}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => downloadAllClientDocuments(client)}
                      className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      Télécharger tout
                    </button>
                    <button
                      onClick={() => deleteClient(index)}
                      className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="font-sans">
      {currentView === 'home' && <HomeView />}
      {currentView === 'client' && <ClientView />}
      {currentView === 'admin' && (
        adminAuth.isAuthenticated ? <AdminView /> : <AdminLoginView />
      )}
    </div>
  );
}

export default App;
