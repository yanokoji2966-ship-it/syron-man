import React, { useState, useCallback, useRef } from 'react';
import { 
    Upload, FileText, Image as ImageIcon, CheckCircle, AlertCircle, 
    RefreshCw, Download, Play, Trash2, Layers, Search, BarChart3, 
    ArrowRight, Info, FileSpreadsheet, X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { productService } from '../../services/productService';
import { useUploadQueue } from '../../hooks/useUploadQueue';
import { useToast } from '../Toast';

const BulkImportProducts = () => {
    const [step, setStep] = useState('upload'); // upload, preview, importing, finished
    const [importData, setImportData] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);
    const [stats, setStats] = useState({ created: 0, updated: 0, ignored: 0, errors: [] });
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentBatch, setCurrentBatch] = useState(0);
    const [totalBatches, setTotalBatches] = useState(0);
    const [progress, setProgress] = useState(0);
    
    const { processQueue, processing: imagesProcessing, progress: imagesProgress } = useUploadQueue(4);
    const { showToast } = useToast();
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);

    // --- PARSERS ---

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        const extension = file.name.split('.').pop().toLowerCase();

        if (extension === 'csv') {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    setImportData(results.data);
                    setStep('preview');
                }
            });
        } else if (['xlsx', 'xls'].includes(extension)) {
            reader.onload = (evt) => {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                setImportData(data);
                setStep('preview');
            };
            reader.readAsBinaryString(file);
        } else {
            showToast('Formato de arquivo não suportado. Use CSV ou XLSX.', 'error');
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setImageFiles(prev => [...prev, ...files]);
    };

    const removeImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    // --- LÓGICA DE IMPORTAÇÃO ---

    const startImport = async () => {
        setIsProcessing(true);
        setStep('importing');
        setStats({ created: 0, updated: 0, ignored: 0, errors: [] });

        let imageMap = {};

        // 1. Processar Imagens Primeiro (Opcional)
        if (imageFiles.length > 0) {
            showToast('Iniciando upload de imagens em lote...', 'info');
            const { results } = await processQueue(imageFiles);
            imageMap = results; // { "nome_arquivo.jpg": "url_pública" }
        }

        // 2. Processar Dados em Lotes de 50
        const batchSize = 50;
        const totalItems = importData.length;
        const totalBatchesNeeded = Math.ceil(totalItems / batchSize);
        setTotalBatches(totalBatchesNeeded);

        let localCreated = 0;
        let localUpdated = 0;
        let localIgnored = 0;
        let localErrors = [];

        for (let i = 0; i < totalItems; i += batchSize) {
            const batchIndex = Math.floor(i / batchSize) + 1;
            setCurrentBatch(batchIndex);
            
            const chunk = importData.slice(i, i + batchSize).map(item => {
                // Tenta associar imagem por nome de arquivo se disponível
                let finalImageUrl = item.imagem || item.image_url || '';
                
                // Busca na lista de imagens enviadas se o nome bater
                if (imageMap) {
                    const match = Object.keys(imageMap).find(filename => {
                        const nameOnly = filename.split('.').slice(0, -1).join('.').toLowerCase();
                        const productName = (item.nome || item.name || '').toString().toLowerCase();
                        return nameOnly === productName || filename.toLowerCase() === productName;
                    });
                    if (match) finalImageUrl = imageMap[match];
                }

                return {
                    name: item.nome || item.name,
                    description: item.descricao || item.description || '',
                    price: parseFloat(item.preco || item.price || 0),
                    cost_price: parseFloat(item.custo || item.cost_price || 0),
                    stock_quantity: parseInt(item.estoque || item.stock_quantity || 0),
                    category_name: item.categoria || item.category || 'Geral',
                    material: item.material || '',
                    image_url: finalImageUrl,
                    is_active: true
                };
            });

            try {
                const response = await productService.bulkImport(chunk);
                localCreated += response.created;
                localUpdated += response.updated;
                localIgnored += response.ignored;
                if (response.errors) localErrors = [...localErrors, ...response.errors];
                
                setProgress(Math.round(((i + chunk.length) / totalItems) * 100));
            } catch (err) {
                console.error('Falha no lote:', err);
                localErrors.push({ name: `Lote ${batchIndex}`, error: 'Erro de conexão no lote.' });
            }

            // Pequeno delay entre lotes para não sobrecarregar o DB
            await new Promise(r => setTimeout(r, 300));
        }

        setStats({
            created: localCreated,
            updated: localUpdated,
            ignored: localIgnored,
            errors: localErrors
        });
        setIsProcessing(false);
        setStep('finished');
        showToast('Importação concluída!', 'success');
    };

    const downloadTemplate = () => {
        const template = [
            { nome: 'Camisa Polo Premium', descricao: 'Algodão Pima de alta qualidade', preco: 159.90, custo: 45.00, estoque: 50, categoria: 'Camisas', material: 'Algodão Pima' },
            { nome: 'Calça Alfaiataria Slim', descricao: 'Corte moderno e confortável', preco: 249.00, custo: 80.00, estoque: 30, categoria: 'Calças', material: 'Lã Fria' }
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Modelo");
        XLSX.writeFile(wb, "SyronMan_Modelo_Importacao.xlsx");
    };

    return (
        <div className="bulk-import-container animate-fade">
            <div className="admin-header-row" style={{ marginBottom: '32px' }}>
                <div>
                    <h2 style={{ fontSize: '28px', fontWeight: '900', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Layers size={32} /> Turbo Bulk Import
                    </h2>
                    <p style={{ color: 'var(--text-muted)' }}>Importação massiva de produtos com inteligência de sincronização.</p>
                </div>
                {step !== 'upload' && (
                    <button onClick={() => setStep('upload')} className="icon-btn-admin">
                        <RefreshCw size={18} /> Recomeçar
                    </button>
                )}
            </div>

            {/* STEP 1: UPLOAD */}
            {step === 'upload' && (
                <div className="import-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div className="import-card glass" onClick={() => fileInputRef.current.click()}>
                        <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept=".csv,.xlsx,.xls" />
                        <div className="card-icon"><FileSpreadsheet size={40} /></div>
                        <h3>Planilha de Produtos</h3>
                        <p>Arraste seu CSV ou Excel aqui para processar os dados.</p>
                        <button className="primary-btn-mini">Selecionar Arquivo</button>
                        <div className="template-link" onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}>
                            <Download size={14} /> Baixar Modelo
                        </div>
                    </div>

                    <div className="import-card glass" onClick={() => imageInputRef.current.click()}>
                        <input type="file" ref={imageInputRef} hidden multiple onChange={handleImageChange} accept="image/*" />
                        <div className="card-icon"><ImageIcon size={40} /></div>
                        <h3>Pasta de Imagens</h3>
                        <p>Opcional: Selecione as fotos dos produtos. O sistema associa pelo nome.</p>
                        <button className="secondary-btn-mini">Upload de Fotos ({imageFiles.length})</button>
                    </div>
                </div>
            )}

            {/* STEP 2: PREVIEW */}
            {step === 'preview' && (
                <div className="preview-section animate-scale-in">
                    <div className="stats-row">
                        <div className="stat-pill"><BarChart3 size={14} /> {importData.length} Produtos Detectados</div>
                        <div className="stat-pill"><ImageIcon size={14} /> {imageFiles.length} Fotos para Vincular</div>
                    </div>

                    <div className="glass-table-container" style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '24px' }}>
                        <table className="orders-table detailed">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Preço</th>
                                    <th>Estoque</th>
                                    <th>Categoria</th>
                                    <th>Status Esperado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {importData.slice(0, 50).map((item, idx) => (
                                    <tr key={idx}>
                                        <td style={{ fontWeight: 'bold' }}>{item.nome || item.name}</td>
                                        <td>R$ {item.preco || item.price}</td>
                                        <td>{item.estoque || item.stock_quantity}</td>
                                        <td>{item.categoria || item.category}</td>
                                        <td><span className="badge-new">Analisando...</span></td>
                                    </tr>
                                ))}
                                {importData.length > 50 && (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', opacity: 0.5 }}>... e mais {importData.length - 50} itens.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="actions-footer">
                        <button className="add-product-btn" style={{ padding: '15px 40px', fontSize: '18px' }} onClick={startImport}>
                            <Play size={20} /> INICIAR IMPORTAÇÃO TURBO
                        </button>
                        <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <Info size={12} /> O sistema processará em lotes de 50 para garantir estabilidade.
                        </p>
                    </div>
                </div>
            )}

            {/* STEP 3: IMPORTING */}
            {step === 'importing' && (
                <div className="processing-screen glass animate-fade">
                    <div className="processing-header">
                        <div className="spinner-large">
                            <RefreshCw size={48} className="animate-spin" />
                        </div>
                        <h2>Sincronizando Banco de Dados...</h2>
                        <p>Processando lote {currentBatch} de {totalBatches}</p>
                    </div>

                    <div className="progress-container">
                        <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="progress-labels">
                            <span>{progress}% Concluído</span>
                            <span>{importData.length} itens totais</span>
                        </div>
                    </div>

                    {imagesProcessing && (
                        <div className="sub-progress">
                            <p><ImageIcon size={14} /> Uploading Imagens: {imagesProgress}%</p>
                        </div>
                    )}

                    <div className="live-logs glass">
                        <p>➤ Lote {currentBatch} enviado...</p>
                        <p>➤ Sincronizando metadados de estoque...</p>
                        {stats.errors.length > 0 && <p className="log-error">⚠ {stats.errors.length} falhas registradas.</p>}
                    </div>
                </div>
            )}

            {/* STEP 4: FINISHED */}
            {step === 'finished' && (
                <div className="finished-section animate-scale-in">
                    <div className="result-card glass">
                        <div className="result-header">
                            <CheckCircle size={60} color="#4ade80" />
                            <h2>Processamento Finalizado!</h2>
                        </div>
                        
                        <div className="result-grid">
                            <div className="res-item">
                                <span className="val">{stats.created}</span>
                                <span className="lab">Criados</span>
                            </div>
                            <div className="res-item">
                                <span className="val">{stats.updated}</span>
                                <span className="lab">Atualizados</span>
                            </div>
                            <div className="res-item">
                                <span className="val">{stats.ignored}</span>
                                <span className="lab">Ignorados</span>
                            </div>
                            <div className="res-item" style={{ color: stats.errors.length > 0 ? '#ef4444' : 'inherit' }}>
                                <span className="val">{stats.errors.length}</span>
                                <span className="lab">Erros</span>
                            </div>
                        </div>

                        {stats.errors.length > 0 && (
                            <div className="error-report glass">
                                <h3>Relatório de Falhas</h3>
                                <div className="error-list">
                                    {stats.errors.map((err, i) => (
                                        <div key={i} className="error-entry">
                                            <strong>{err.name}:</strong> {err.error}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button className="primary-btn" onClick={() => window.location.reload()} style={{ marginTop: '30px' }}>
                            Concluir e Voltar ao Painel
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .import-card {
                    padding: 40px; text-align: center; cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .import-card:hover { 
                    transform: translateY(-5px); 
                    border-color: var(--secondary);
                    background: rgba(212,175,55,0.05);
                }
                .card-icon { color: var(--secondary); margin-bottom: 20px; transition: 0.3s; }
                .import-card:hover .card-icon { transform: scale(1.1); filter: drop-shadow(0 0 10px var(--secondary)); }
                
                .template-link { 
                    margin-top: 20px; font-size: 12px; color: var(--text-muted); 
                    display: flex; align-items: center; justify-content: center; gap: 4px;
                }
                .template-link:hover { color: var(--secondary); text-decoration: underline; }

                .progress-bar-bg { width: 100%; height: 12px; background: rgba(255,255,255,0.05); border-radius: 6px; overflow: hidden; margin: 20px 0; }
                .progress-bar-fill { height: 100%; background: linear-gradient(90deg, var(--secondary), #fff); transition: width 0.4s ease; }
                .progress-labels { display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: var(--text-muted); }

                .processing-screen { padding: 60px; text-align: center; }
                .spinner-large { margin-bottom: 24px; color: var(--secondary); }

                .live-logs { margin-top: 40px; padding: 20px; background: rgba(0,0,0,0.3); text-align: left; font-family: monospace; font-size: 13px; color: #4ade80; }
                .log-error { color: #ef4444; }

                .result-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 40px 0; }
                .res-item { background: rgba(255,255,255,0.03); padding: 20px; border-radius: 12px; display: flex; flexDirection: column; }
                .res-item .val { font-size: 24px; font-weight: 900; }
                .res-item .lab { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.5; }

                .error-report { margin-top: 30px; padding: 20px; text-align: left; }
                .error-list { max-height: 200px; overflow-y: auto; }
                .error-entry { padding: 8px 0; border-bottom: 1px solid rgba(255,0,0,0.1); font-size: 12px; color: #f87171; }
                
                .badge-new { font-size: 10px; background: rgba(59,130,246,0.1); color: #60a5fa; padding: 4px 8px; border-radius: 4px; }
            `}</style>
        </div>
    );
};

export default BulkImportProducts;
