import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface AdminOption {
  id: string;
  name: string;
  description: string;
  category: string;
  attributes: Array<{
    type: string;
    value: string;
    rating: string;
    description: string;
  }>;
}

interface AdminIntegration {
  id: string;
  name: string;
  category: string;
}

interface IntegrationSuggestion {
  name: string;
  category: string;
  reason: string;
}

interface NewOption {
  name: string;
  description: string;
  category: string;
  attributes: {
    cost_model: { value: string; rating: 'low' | 'medium' | 'high'; description: string };
    scalability: { value: string; rating: 'low' | 'medium' | 'high'; description: string };
    complexity: { value: string; rating: 'low' | 'medium' | 'high'; description: string };
    maintenance: { value: string; rating: 'low' | 'medium' | 'high'; description: string };
  };
}

const emptyOption: NewOption = {
  name: '',
  description: '',
  category: '',
  attributes: {
    cost_model: { value: '', rating: 'medium', description: '' },
    scalability: { value: '', rating: 'medium', description: '' },
    complexity: { value: '', rating: 'medium', description: '' },
    maintenance: { value: '', rating: 'medium', description: '' },
  },
};

export function AdminPanel({ onClose }: { onClose: () => void }) {
  const [options, setOptions] = useState<AdminOption[]>([]);
  const [integrations, setIntegrations] = useState<AdminIntegration[]>([]);
  const [showAddOption, setShowAddOption] = useState(false);
  const [showAddIntegration, setShowAddIntegration] = useState(false);
  const [newOption, setNewOption] = useState<NewOption>(emptyOption);
  const [newIntegration, setNewIntegration] = useState({ name: '', category: '' });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestingIntegrations, setSuggestingIntegrations] = useState(false);
  const [integrationSuggestions, setIntegrationSuggestions] = useState<IntegrationSuggestion[]>([]);
  const [suggestionOption, setSuggestionOption] = useState('');
  const [suggestionUseCase, setSuggestionUseCase] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [optRes, intRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/options`),
        fetch(`${API_BASE_URL}/admin/integrations`),
      ]);
      const optData = await optRes.json();
      const intData = await intRes.json();
      setOptions(optData.options || []);
      setIntegrations(intData.integrations || []);
    } catch (err) {
      setError('Failed to fetch data');
    }
  };

  const handleAddOption = async () => {
    if (!newOption.name || !newOption.description || !newOption.category) {
      setError('Please fill in all required fields');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOption),
      });
      if (!res.ok) throw new Error('Failed to create option');
      setNewOption(emptyOption);
      setShowAddOption(false);
      await fetchData();
    } catch (err) {
      setError('Failed to create option');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOption = async (id: string) => {
    if (!confirm('Are you sure you want to delete this option?')) return;
    try {
      await fetch(`${API_BASE_URL}/admin/options/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (err) {
      setError('Failed to delete option');
    }
  };

  const handleAddIntegration = async () => {
    if (!newIntegration.name || !newIntegration.category) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/integrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIntegration),
      });
      if (!res.ok) throw new Error('Failed to create integration');
      setNewIntegration({ name: '', category: '' });
      setShowAddIntegration(false);
      await fetchData();
    } catch (err) {
      setError('Failed to create integration');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIntegration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return;
    try {
      await fetch(`${API_BASE_URL}/admin/integrations/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (err) {
      setError('Failed to delete integration');
    }
  };

  const handleSuggestIntegrations = async () => {
    if (!suggestionOption) {
      setError('Please select an option first');
      return;
    }
    setSuggestingIntegrations(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/suggest-integrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionName: suggestionOption, useCase: suggestionUseCase }),
      });
      if (!res.ok) throw new Error('Failed to get suggestions');
      const data = await res.json();
      setIntegrationSuggestions(data.suggestions || []);
    } catch (err) {
      setError('Failed to get AI suggestions');
    } finally {
      setSuggestingIntegrations(false);
    }
  };

  const handleAddSuggestedIntegration = async (suggestion: IntegrationSuggestion) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/integrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: suggestion.name, category: suggestion.category }),
      });
      if (!res.ok) throw new Error('Failed to add integration');
      setIntegrationSuggestions(prev => prev.filter(s => s.name !== suggestion.name));
      await fetchData();
    } catch (err) {
      setError('Failed to add integration');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!newOption.name) {
      setError('Please enter an option name first');
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newOption.name }),
      });
      if (!res.ok) throw new Error('AI generation failed');
      const generated = await res.json();
      setNewOption({
        ...newOption,
        description: generated.description,
        category: generated.category,
        attributes: generated.attributes,
      });
    } catch (err) {
      setError('AI generation failed. Make sure AWS credentials are configured.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Admin Panel - Manage Data</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Options Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Options ({options.length})</CardTitle>
              <Button size="sm" onClick={() => setShowAddOption(!showAddOption)}>
                <Plus className="h-4 w-4 mr-1" /> Add Option
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddOption && (
                <div className="p-4 border rounded-lg space-y-4 bg-muted/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Name *</Label>
                      <div className="flex gap-2 mt-1">
                        <input
                          className="flex-1 px-3 py-2 border rounded-md bg-background"
                          value={newOption.name}
                          onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
                          placeholder="e.g., AWS DynamoDB"
                        />
                        <Button 
                          variant="outline" 
                          onClick={handleGenerateWithAI}
                          disabled={generating || !newOption.name}
                          title="Generate description and attributes with AI"
                        >
                          {generating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter name and click ✨ to auto-generate details
                      </p>
                    </div>
                    <div>
                      <Label>Category *</Label>
                      <input
                        className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                        value={newOption.category}
                        onChange={(e) => setNewOption({ ...newOption, category: e.target.value })}
                        placeholder="e.g., database"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Description *</Label>
                    <textarea
                      className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                      value={newOption.description}
                      onChange={(e) => setNewOption({ ...newOption, description: e.target.value })}
                      placeholder="Describe this option..."
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {(['cost_model', 'scalability', 'complexity', 'maintenance'] as const).map((attr) => (
                      <div key={attr} className="space-y-2 p-3 border rounded-md">
                        <Label className="capitalize">{attr.replace('_', ' ')}</Label>
                        <input
                          className="w-full px-2 py-1 border rounded-md bg-background text-sm"
                          value={newOption.attributes[attr].value}
                          onChange={(e) => setNewOption({
                            ...newOption,
                            attributes: {
                              ...newOption.attributes,
                              [attr]: { ...newOption.attributes[attr], value: e.target.value }
                            }
                          })}
                          placeholder="Value"
                        />
                        <select
                          className="w-full px-2 py-1 border rounded-md bg-background text-sm"
                          value={newOption.attributes[attr].rating}
                          onChange={(e) => setNewOption({
                            ...newOption,
                            attributes: {
                              ...newOption.attributes,
                              [attr]: { ...newOption.attributes[attr], rating: e.target.value as 'low' | 'medium' | 'high' }
                            }
                          })}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddOption} disabled={loading}>
                      <Save className="h-4 w-4 mr-1" /> Save Option
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddOption(false)}>Cancel</Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {options.map((option) => (
                  <div key={option.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <span className="font-medium">{option.name}</span>
                      <Badge variant="outline" className="ml-2">{option.category}</Badge>
                      <p className="text-sm text-muted-foreground mt-1">{option.description.slice(0, 100)}...</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteOption(option.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Integrations Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Integrations ({integrations.length})</CardTitle>
              <Button size="sm" onClick={() => setShowAddIntegration(!showAddIntegration)}>
                <Plus className="h-4 w-4 mr-1" /> Add Integration
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddIntegration && (
                <div className="p-4 border rounded-lg space-y-4 bg-muted/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Name *</Label>
                      <input
                        className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                        value={newIntegration.name}
                        onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
                        placeholder="e.g., AWS Lambda"
                      />
                    </div>
                    <div>
                      <Label>Category *</Label>
                      <input
                        className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                        value={newIntegration.category}
                        onChange={(e) => setNewIntegration({ ...newIntegration, category: e.target.value })}
                        placeholder="e.g., compute"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddIntegration} disabled={loading}>
                      <Save className="h-4 w-4 mr-1" /> Save Integration
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddIntegration(false)}>Cancel</Button>
                  </div>
                </div>
              )}

              {/* AI Integration Suggestions */}
              <div className="p-4 border rounded-lg bg-gradient-to-r from-purple-500/5 to-pink-500/5">
                <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  AI Integration Suggestions
                </Label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">For Option</Label>
                    <select
                      className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-sm"
                      value={suggestionOption}
                      onChange={(e) => setSuggestionOption(e.target.value)}
                    >
                      <option value="">Select an option...</option>
                      {options.map((opt) => (
                        <option key={opt.id} value={opt.name}>{opt.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Use Case (optional)</Label>
                    <input
                      className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-sm"
                      value={suggestionUseCase}
                      onChange={(e) => setSuggestionUseCase(e.target.value)}
                      placeholder="e.g., e-commerce, real-time analytics"
                    />
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={handleSuggestIntegrations}
                  disabled={suggestingIntegrations || !suggestionOption}
                  className="bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  {suggestingIntegrations ? (
                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Getting suggestions...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-1" /> Get AI Suggestions</>
                  )}
                </Button>

                {integrationSuggestions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <Label className="text-xs text-muted-foreground">Suggested Integrations:</Label>
                    {integrationSuggestions.map((suggestion, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 border rounded-md bg-background">
                        <div className="flex-1">
                          <span className="text-sm font-medium">{suggestion.name}</span>
                          <Badge variant="outline" className="ml-2 text-xs">{suggestion.category}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">{suggestion.reason}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleAddSuggestedIntegration(suggestion)}>
                          <Plus className="h-3 w-3 mr-1" /> Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {integrations.map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div>
                      <span className="text-sm font-medium">{integration.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">{integration.category}</Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteIntegration(integration.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
