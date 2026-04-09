import React from 'react';
import { ShoppingBag, Briefcase, Shirt, Scissors, Footprints, Watch } from 'lucide-react';
import './CategorySection.css';

const iconMap = {
    'Alfaiataria': <Briefcase size={20} />,
    'Camisas': <Shirt size={20} />,
    'Calças': <Scissors size={20} />,
    'Bermudas': <ShoppingBag size={20} />,
    'Calçados': <Footprints size={20} />,
    'Relógios': <Watch size={20} />,
};

const CategorySection = ({ categories = [], onSelectCategory, selectedCategoryId }) => {
    // If empty or loading, show placeholders
    if (!categories || categories.length === 0) {
        return (
            <section className="categories-section">
                <div className="categories-grid">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="category-pill skeleton" style={{ width: '120px', height: '40px' }}></div>
                    ))}
                </div>
            </section>
        );
    }

    return (
        <section className="categories-section">
            <div className="categories-grid">
                {categories.map((cat) => {
                    const isSelected = selectedCategoryId === cat.id;
                    const isSoon = cat.isSoon || cat.name?.toLowerCase().includes('breve');

                    return (
                        <div
                            key={cat.id}
                            className={`category-pill ${isSelected ? 'selected' : ''}`}
                            onClick={() => onSelectCategory(isSelected ? null : cat.id)}
                        >
                            <span className="category-name">{cat.name}</span>
                            {isSoon && <span className="coming-soon-badge">BREVE</span>}
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default CategorySection;
