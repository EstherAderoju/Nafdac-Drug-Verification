import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Database,
  ExternalLink,
} from 'lucide-react';
import { NAFDAC_PRODUCTS } from '../data/nafdacData';
import { NafdacProduct, VerificationInput } from '../types';

interface DatabaseExplorerProps {
  onSelectForVerification: (input: VerificationInput) => void;
}

export const DatabaseExplorer: React.FC<DatabaseExplorerProps> = ({
  onSelectForVerification,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formFilter, setFormFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const filteredProducts = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return NAFDAC_PRODUCTS.filter(p => {
      const matchSearch =
        !q ||
        p.product_name.toLowerCase().includes(q) ||
        p.nrn.toLowerCase().includes(q) ||
        p.active_ingredient.toLowerCase().includes(q) ||
        p.manufacturer_name.toLowerCase().includes(q);

      const matchStatus =
        statusFilter === 'all' || p.status.toLowerCase() === statusFilter.toLowerCase();

      const matchForm =
        formFilter === 'all' || p.dosage_form.toLowerCase().includes(formFilter.toLowerCase());

      return matchSearch && matchStatus && matchForm;
    });
  }, [searchTerm, statusFilter, formFilter]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page, pageSize]);

  const handleVerifyRow = (p: NafdacProduct) => {
    onSelectForVerification({
      product_name: p.product_name,
      nrn: p.nrn,
      active_ingredient: p.active_ingredient,
      strength: p.strength,
      manufacturer_name: p.manufacturer_name,
      dosage_form: p.dosage_form,
      expiry_date: p.expiry_date,
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center space-x-2.5">
            <Database className="w-6 h-6 text-emerald-600" />
            <span>NAFDAC Pharmaceutical Product Registry</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Authoritative reference dataset of {NAFDAC_PRODUCTS.length} registered pharmaceutical products
          </p>
        </div>
        <div className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          Showing <span className="text-emerald-600 font-bold">{filteredProducts.length}</span> matching records
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search by brand name, NRN (e.g. 04-8969), active ingredient, manufacturer..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          >
            <option value="all">All Regulatory Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div>
          <select
            value={formFilter}
            onChange={e => {
              setFormFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          >
            <option value="all">All Dosage Forms</option>
            <option value="tablet">Tablets</option>
            <option value="capsule">Capsules</option>
            <option value="syrup">Syrup / Liquids</option>
            <option value="injection">Injections</option>
            <option value="suspension">Suspensions</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Product Name</th>
              <th className="px-4 py-3">NRN</th>
              <th className="px-4 py-3">Active Ingredient & Strength</th>
              <th className="px-4 py-3">Manufacturer</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Expiry</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedProducts.length > 0 ? (
              paginatedProducts.map(p => {
                const isActive = p.status.toLowerCase() === 'active';
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-bold text-slate-800 max-w-[180px] truncate">
                      {p.product_name}
                      <span className="block text-[10px] font-normal text-slate-400">{p.dosage_form}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-700 font-bold whitespace-nowrap">
                      {p.nrn}
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate">
                      <span className="text-slate-700 font-medium">{p.active_ingredient}</span>
                      <span className="block text-[10px] text-slate-400">{p.strength}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">
                      {p.manufacturer_name}
                      <span className="block text-[10px] text-slate-400">{p.manufacturer_country}</span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {p.expiry_date || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleVerifyRow(p)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition text-[11px] font-bold"
                      >
                        <span>Verify</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                  No registered products found matching your search and filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-slate-500 font-medium">
          Page <strong className="text-slate-800">{page}</strong> of <strong className="text-slate-800">{totalPages}</strong>
        </span>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition border border-slate-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition border border-slate-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
