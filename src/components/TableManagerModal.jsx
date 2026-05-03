import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import { X, Pencil, Trash2, Plus, Save } from 'lucide-react';
import { useTableStore } from '@/store/useTableStore';

export default function TableManagerModal({ open, onClose }) {
  const { fetchTables, tables } = useTableStore();
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { if (open) fetchTables(); }, [open, fetchTables]);
  useEffect(() => {
    if (!open) { setName(''); setCapacity(4); setEditingId(null); }
  }, [open]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && open) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const startEdit = (t) => { setEditingId(t.id); setName(t.name); setCapacity(t.capacity); };

  const saveEdit = async () => {
    if (!editingId || !name.trim()) return;
    const res = await window.electronAPI.updateTable(editingId, {
      name: name.trim(),
      capacity: Number(capacity) || 4,
    });
    if (res) {
      toast.success('Mesa actualizada');
      setEditingId(null); setName(''); setCapacity(4);
      await fetchTables();
    }
  };

  const addTable = async () => {
    if (!name.trim()) { toast.error('Indica el nombre'); return; }
    await window.electronAPI.createTable({
      name: name.trim(),
      capacity: Number(capacity) || 4,
    });
    toast.success('Mesa creada');
    setName(''); setCapacity(4);
    await fetchTables();
  };

  const toggle = async (id) => {
    await window.electronAPI.toggleTable(id);
    await fetchTables();
  };

  const remove = async (id) => {
    const res = await window.electronAPI.deleteTable(id);
    if (res?.error) { toast.error(res.error); return; }
    toast.success('Mesa eliminada');
    await fetchTables();
  };

  return (
    <Box
      onClick={onClose}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1350,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(4px)',
        p: 2,
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          borderRadius: 4,
          boxShadow: 24,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 3,
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Gestionar mesas
          </Typography>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <X size={24} />
          </IconButton>
        </Box>

        {/* Table List */}
        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 3 }}>
          <Stack spacing={1.5}>
            {(tables || []).map((t) => (
              <Box
                key={t.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'rgba(241, 245, 249, 0.5)',
                  flexWrap: 'wrap',
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{t.name}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    Capacidad: {t.capacity}
                  </Typography>
                  <Typography variant="caption" sx={{ color: t.active ? 'success.main' : 'text.secondary', fontWeight: 600 }}>
                    {t.active ? 'Visible en mapa' : 'Oculta'}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                  <Switch
                    size="small"
                    checked={!!t.active}
                    onChange={() => toggle(t.id)}
                    color="success"
                  />
                  <IconButton
                    size="small"
                    onClick={() => startEdit(t)}
                    sx={{
                      bgcolor: 'rgba(99, 102, 241, 0.08)',
                      '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.15)' },
                    }}
                  >
                    <Pencil size={16} color="#6366f1" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => remove(t.id)}
                    sx={{
                      bgcolor: 'rgba(239, 68, 68, 0.08)',
                      '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.15)' },
                    }}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </IconButton>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>

        <Divider />

        {/* Form */}
        <Box sx={{ p: 3 }}>
          {editingId ? (
            <Stack spacing={2}>
              <Typography variant="body2" sx={{ color: 'warning.dark', fontWeight: 700 }}>
                ✏️ Editando mesa #{editingId}
              </Typography>
              <TextField
                fullWidth
                label="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 700 } } }}
              />
              <TextField
                fullWidth
                type="number"
                label="Capacidad"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 700 } } }}
                inputProps={{ min: 1 }}
              />
              <Stack direction="row" spacing={2}>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  onClick={saveEdit}
                  startIcon={<Save size={18} />}
                  sx={{ borderRadius: 3, py: 1.5, fontWeight: 800 }}
                >
                  Guardar
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  color="inherit"
                  onClick={() => { setEditingId(null); setName(''); setCapacity(4); }}
                  sx={{ borderRadius: 3, py: 1.5, fontWeight: 800, borderColor: 'divider' }}
                >
                  Cancelar
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                Nueva mesa
              </Typography>
              <TextField
                fullWidth
                label="Nombre (ej. Mesa 5)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 700 } } }}
              />
              <TextField
                fullWidth
                type="number"
                label="Capacidad"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 700 } } }}
                inputProps={{ min: 1 }}
              />
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={addTable}
                startIcon={<Plus size={18} />}
                sx={{ borderRadius: 3, py: 1.5, fontWeight: 800 }}
              >
                Agregar mesa
              </Button>
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}
