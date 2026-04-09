import React, { useState } from 'react';
import { X, Plus, Trash2, Save, ShoppingBag, Package, List, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { productService } from '../../services/productService';
import './BatchProductCreator.css';

const BatchProductCreator = ({ categories = [], onClose, onSaveComplete }) => {
    const [rows, setRows] = useState([
        { id: Date.now(), name: '', price: '', stock: '', category_id: categories[0]?.id || '', status: 'idle' }
    ]);
    const [isSaving, setIsSaving] = useState(false);
    const [summary, setSummary] = useState(null);

    const addRow = () => {
        setRows([...rows, { id: Date.now(), name: '', price: '', stock: '', category_id: categories[0]?.id || '', status: 'idle' }]);
    };

    const removeRow = (id) => {
        if (rows.length === 1) return;
        setRows(rows.filter(r => r.id !== id));
    };

    const updateRow = (id, field, value) => {
        setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleSaveAll = async () => {
        const validRows = rows.filter(r => r.name && r.price);
        if (validRows.length === 0) {
            alert('Por favor, preencha pelo menos um produto com nome e preço.');
            return;
        }

        setIsSaving(true);
        let successCount = 0;
        let failCount = 0;

        // Processamento em lote (simulado concorrente com limite)
        const results = await Promise.allSettled(validRows.map(async (row) => {
            try {
                // Atualiza status da linha para processando
                setRows(prev => prev.map(r => r.id === row.id ? { ...r, status: 'saving' } : r));
                
                const payload = {
                    name: row.name,
                    price: parseFloat(row.price),
                    stock_quantity: parseInt(row.stock) || 0,
                    category_id: row.category_id,
                    is_active: true
                };

                await productService.saveProduct(payload);
                
                successCount++;
                setRows(prev => prev.map(r => r.id === row.id ? { ...r, status: 'success' } : r));
                return true;
            } catch (err) {
                failCount++;
                setRows(prev => prev.map(r => r.id === row.id ? { ...r, status: 'error' } : r));
                throw err;
            }
        }));

        setIsSaving(false);
        setSummary({ success: successCount, fail: failCount });
        
        if (onSaveComplete) onSaveComplete();
    };

    return (
        <div className="admin-modal-overlay animate-fade">
            <div className="batch-creator-card glass animate-scale-in">
                <header className="batch-header">
                    <div>
                        <h2>Cadastro em Lote (Fast Entry)</h2>
                        <p>Adicione múltiplos produtos ao catálogo em segundos.</p>
                    </div>
                    <button onClick={onClose} className="icon-btn-pixel"><X size={20} /></button>
                </header>

                <div className="batch-table-container">
                    <table className="batch-table">
                        <thead>
                            <tr>
                                <th>Nome do Produto</th>
                                <th>Preço (R$)</th>
                                <th>Estoque</th>
                                <th>Categoria</th>
                                <th style={{ width: '80px' }}>Status</th>
                                <th style={{ width: '40px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id} className={`batch-row status-${row.status}`}>
                                    <td>
                                        <input 
                                            type="text" 
                                            placeholder="Ex: Corrente de Ouro..."
                                            value={row.name}
                                            onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                                            disabled={isSaving || row.status === 'success'}
                                        />
                                    </td>
                                    <td>
                                        <input 
                                            type="number" 
                                            placeholder="0,00"
                                            value={row.price}
                                            onChange={(e) => updateRow(row.id, 'price', e.target.value)}
                                            disabled={isSaving || row.status === 'success'}
                                        />
                                    </td>
                                    <td>
                                        <input 
                                            type="number" 
                                            placeholder="0"
                                            value={row.stock}
                                            onChange={(e) => updateRow(row.id, 'stock', e.target.value)}
                                            disabled={isSaving || row.status === 'success'}
                                        />
                                    </td>
                                    <td>
                                        <select 
                                            value={row.category_id}
                                            onChange={(e) => updateRow(row.id, 'category_id', e.target.value)}
                                            disabled={isSaving || row.status === 'success'}
                                        >
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="row-status-cell">
                                        {row.status === 'saving' && <RefreshCw size={14} className="animate-spin text-gold" />}
                                        {row.status === 'success' && <CheckCircle size={14} className="text-green" />}
                                        {row.status === 'error' && <AlertCircle size={14} className="text-danger" />}
                                        {row.status === 'idle' && <div className="dot-idle"></div>}
                                    </td>
                                    <td>
                                        <button 
                                            className="row-delete-btn" 
                                            onClick={() => removeRow(row.id)}
                                            disabled={isSaving || row.status === 'success'}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="batch-actions">
                    <button className="add-row-btn" onClick={addRow} disabled={isSaving}>
                        <Plus size={16} /> Adicionar Linha
                    </button>

                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        {summary && (
                            <div className="batch-summary">
                                <span className="text-green">{summary.success} salvos</span>
                                {summary.fail > 0 && <span className="text-danger"> | {summary.fail} erros</span>}
                            </div>
                        )}
                        <button className="cancel-btn" onClick={onClose} disabled={isSaving}>Cancelar</button>
                        <button className="save-all-btn" onClick={handleSaveAll} disabled={isSaving}>
                            {isSaving ? (
                                <><RefreshCw size={16} className="animate-spin" /> Processando...</>
                            ) : (
                                <><Save size={16} /> Salvar Tudo</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BatchProductCreator;
