import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Trash2, Edit2, AlertTriangle, X, DollarSign, Hash, Tag, TrendingUp, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Product } from '../types';
import { useAuth } from '../contexts/AuthContext';

const API_URL = '/api';

export default function InventoryTab() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'promotion'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    stock_quantity: 0,
    min_stock: 5,
    category: '',
    image_url: '',
    is_promotion: false,
    promotion_price: 0
  });

  const isClient = user?.permissions === 'client';
  const isAdmin = user?.permissions === 'super_admin' || user?.permissions === 'admin';

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products`, { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        ...product,
        is_promotion: !!product.is_promotion,
        promotion_price: product.promotion_price || 0
      });
    } else {
      setEditingProduct(null);
      setFormData({ 
        name: '', 
        description: '', 
        price: 0, 
        stock_quantity: 0, 
        min_stock: 5, 
        category: '',
        image_url: '',
        is_promotion: false,
        promotion_price: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingProduct ? 'PUT' : 'POST';
    const url = editingProduct ? `${API_URL}/products/${editingProduct.id}` : `${API_URL}/products`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      if (res.ok) {
        fetchProducts();
        setIsModalOpen(false);
        toast.success(editingProduct ? 'Produto atualizado!' : 'Produto cadastrado!');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Erro ao salvar produto');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    }
  };

  const deleteProduct = async (id: number) => {
    if (confirm('Excluir este produto do estoque?')) {
      try {
        const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE', credentials: 'include' });
        if (res.ok) {
          fetchProducts();
          toast.success('Produto removido');
        }
      } catch (err) {
        toast.error('Erro ao remover produto');
      }
    }
  };

  const categoryOptions = Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort();

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'low' && p.stock_quantity <= (p.min_stock || 0)) ||
      (stockFilter === 'promotion' && !!p.is_promotion);

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou categoria..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`bg-white px-4 py-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-colors ${
            showFilters || categoryFilter !== 'all' || stockFilter !== 'all'
              ? 'text-brand-primary border-brand-primary/30 bg-brand-primary/5'
              : 'text-surface-600 border-surface-200 hover:bg-surface-50'
          }`}
        >
          <Filter className="w-4 h-4" /> Filtros
        </button>
        {!isClient && (
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-5 h-5" />
            Novo Produto
          </button>
        )}
      </div>

      {showFilters && (
        <div className="bg-white border border-surface-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl outline-none font-medium text-sm"
          >
            <option value="all">Todas as categorias</option>
            {categoryOptions.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
            className="px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl outline-none font-medium text-sm"
          >
            <option value="all">Todos os produtos</option>
            <option value="low">Estoque baixo</option>
            <option value="promotion">Promoções</option>
          </select>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div
                layout
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2rem] border border-surface-200 overflow-hidden hover:shadow-xl hover:shadow-brand-primary/5 transition-all group flex flex-col h-full"
              >
                <div className="aspect-square relative overflow-hidden bg-surface-50">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-surface-200" />
                    </div>
                  )}
                  
                  {product.is_promotion && (
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1 animate-pulse">
                      <TrendingUp className="w-3 h-3" />
                      PROMOÇÃO
                    </div>
                  )}

                  {!isClient && product.stock_quantity <= (product.min_stock || 0) && (
                    <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg">
                      Estoque Baixo
                    </div>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <div className="mb-4">
                    <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest bg-brand-primary/5 px-2 py-1 rounded-md">
                      {product.category || 'Geral'}
                    </span>
                    <h3 className="text-lg font-bold text-surface-900 mt-2 line-clamp-2 leading-tight group-hover:text-brand-primary transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  <div className="mt-auto">
                    <div className="flex flex-col">
                      {product.is_promotion && product.promotion_price ? (
                        <>
                          <span className="text-sm text-surface-400 line-through">
                            R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-2xl font-display font-bold text-red-600">
                            R$ {product.promotion_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </>
                      ) : (
                        <span className="text-2xl font-display font-bold text-surface-900">
                          R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-4 border-t border-surface-100">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${product.stock_quantity > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">
                          {product.stock_quantity > 0 ? 'Disponível' : 'Esgotado'}
                        </span>
                      </div>
                      
                      {!isClient && (
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleOpenModal(product)}
                            className="p-2 text-surface-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteProduct(product.id)}
                            className="p-2 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-surface-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-surface-100 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-xl font-display font-bold text-surface-950">{editingProduct ? 'Editar' : 'Novo'} Produto</h3>
                  <p className="text-sm text-surface-500">Dados do item no estoque.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-surface-100 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-surface-700">Nome do Produto</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input 
                      required
                      type="text" 
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 outline-none"
                      placeholder="Ex: Pastilha de Freio Dianteira"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-surface-700">URL da Imagem</label>
                  <input 
                    type="text" 
                    value={formData.image_url || ''}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 outline-none"
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
                  <input 
                    type="checkbox" 
                    id="is_promotion"
                    checked={formData.is_promotion || false}
                    onChange={(e) => setFormData({...formData, is_promotion: e.target.checked})}
                    className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="is_promotion" className="text-sm font-bold text-red-900 cursor-pointer">Produto em Promoção</label>
                </div>

                {formData.is_promotion && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-red-700">Preço Promocional (R$)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                      <input 
                        required
                        type="number" 
                        step="0.01"
                        value={formData.promotion_price || ''}
                        onChange={(e) => setFormData({...formData, promotion_price: parseFloat(e.target.value)})}
                        className="w-full pl-10 pr-4 py-2.5 bg-red-50 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none text-red-900"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-surface-700">Preço Venda (R$)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                      <input 
                        required
                        type="number" 
                        step="0.01"
                        value={formData.price || ''}
                        onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                        className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-surface-700">Categoria</label>
                    <input 
                      type="text" 
                      value={formData.category || ''}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 outline-none"
                      placeholder="Ex: Freios"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-surface-700">Qtd. Atual</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                      <input 
                        required
                        type="number" 
                        value={formData.stock_quantity || ''}
                        onChange={(e) => setFormData({...formData, stock_quantity: parseInt(e.target.value)})}
                        className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-surface-700">Estoque Mínimo</label>
                    <input 
                      required
                      type="number" 
                      value={formData.min_stock || ''}
                      onChange={(e) => setFormData({...formData, min_stock: parseInt(e.target.value)})}
                      className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-surface-700">Descrição / Observações</label>
                  <textarea 
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 outline-none min-h-[80px]"
                    placeholder="Marca, compatibilidade, etc."
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-surface-200 text-surface-600 font-bold rounded-xl hover:bg-surface-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-brand-primary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {editingProduct ? 'Atualizar' : 'Salvar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
