import React from 'react';
import { useQueryStore } from '../store/queryStore';
import { 
  FileText, 
  Trash2, 
  Play, 
  Calendar, 
  Database,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UploadedFilesPage: React.FC = () => {
  const { uploadedFiles, removeUploadedFile, setDataSource, setSelectedTable, setQuery, setSql } = useQueryStore();
  const navigate = useNavigate();

  const handleQuery = (file: any) => {
    setDataSource({ type: 'file', name: file.name, details: `Loaded into table: ${file.tableName}` });
    setSelectedTable(file.tableName);
    setQuery(`Show me the first 100 rows from ${file.tableName}`);
    setSql(`SELECT * FROM ${file.tableName} LIMIT 100;`);
    navigate('/workspace');
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="h-full bg-background overflow-y-auto custom-scrollbar">
      <div className="max-w-[1000px] mx-auto p-12 space-y-12">
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-text-primary">Uploaded Files</h1>
            <p className="text-text-secondary">Manage and query your ingested datasets</p>
          </div>
          <div className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold">
            {uploadedFiles.length} Files Total
          </div>
        </div>

        {uploadedFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-surface rounded-[32px] border border-dashed border-border">
            <div className="w-16 h-16 bg-subtle-surface rounded-2xl flex items-center justify-center text-text-secondary mb-6">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-bold text-text-primary">No uploaded files yet</h3>
            <p className="text-text-secondary mb-8">Upload your first CSV or Parquet file to see it here.</p>
            <button 
              onClick={() => navigate('/setup')}
              className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Go to Setup
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {uploadedFiles.map((file) => (
              <div 
                key={file.id} 
                className="group bg-surface p-6 rounded-2xl border border-border hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all flex items-center gap-6"
              >
                <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
                  <FileText size={24} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-text-primary truncate">{file.name}</h3>
                    <span className="px-2 py-0.5 bg-subtle-surface text-text-secondary text-[10px] font-bold rounded uppercase">
                      {file.name.split('.').pop()}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-text-secondary">
                    <div className="flex items-center gap-1.5">
                      <Database size={14} className="text-text-secondary" />
                      <span className="font-mono text-[13px]">{file.tableName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-text-secondary" />
                      <span>{new Date(file.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="font-medium text-text-primary">
                      {formatSize(file.size)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleQuery(file)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-all shadow-md active:scale-95"
                  >
                    <Play size={14} />
                    Query
                  </button>
                  <button 
                    onClick={() => removeUploadedFile(file.id)}
                    className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Remove from list"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-subtle-surface rounded-3xl p-8 flex items-start gap-4">
          <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-primary shrink-0 border border-border">
            <Search size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-text-primary">Looking for more?</h4>
            <p className="text-sm text-text-secondary leading-relaxed">
              Files are automatically ingested into DuckDB tables. If you delete a file from this list, 
              it only removes the shortcut—the table remains in the database until the app session is cleared.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
