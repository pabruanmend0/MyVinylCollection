import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    artist: '',
    album_title: '',
    year_of_release: '',
    genre: '',
    purchase_date: '',
    format: 'CD',
    cover_image_url: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/items`);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${backendUrl}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          year_of_release: parseInt(formData.year_of_release)
        }),
      });

      if (response.ok) {
        const newItem = await response.json();
        setItems(prev => [...prev, newItem].sort((a, b) => {
          const artistCompare = a.artist.localeCompare(b.artist);
          if (artistCompare !== 0) return artistCompare;
          return a.genre.localeCompare(b.genre);
        }));
        
        // Reset form
        setFormData({
          artist: '',
          album_title: '',
          year_of_release: '',
          genre: '',
          purchase_date: '',
          format: 'CD',
          cover_image_url: ''
        });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
    
    setLoading(false);
  };

  const cdItems = items.filter(item => item.format === 'CD');
  const lpItems = items.filter(item => item.format === 'LP');

  const ItemCard = ({ item }) => (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Album Cover */}
      <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300">
        {item.cover_image_url ? (
          <img 
            src={item.cover_image_url} 
            alt={`${item.album_title} cover`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400"></div>
        )}
        {/* Fallback for broken images */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-gray-600 hidden">
          <div className="text-center">
            <div className="text-4xl mb-2">🎵</div>
            <div className="text-xs">No Cover</div>
          </div>
        </div>
        {/* Format Badge */}
        <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium shadow-lg ${
          item.format === 'CD' 
            ? 'bg-blue-500 text-white' 
            : 'bg-purple-500 text-white'
        }`}>
          {item.format}
        </span>
      </div>
      
      {/* Album Info */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2 line-clamp-2">{item.album_title}</h3>
        <p className="text-gray-700 font-medium mb-3">{item.artist}</p>
        
        <div className="space-y-1 text-sm text-gray-600">
          <p><span className="font-medium">Genre:</span> {item.genre}</p>
          <p><span className="font-medium">Released:</span> {item.year_of_release}</p>
          <p><span className="font-medium">Purchased:</span> {item.purchase_date}</p>
        </div>
      </div>
    </div>
  );

  const CollectionSection = ({ title, items, bgColor, textColor }) => (
    <div className="mb-12">
      <h2 className={`text-2xl font-bold ${textColor} mb-6 flex items-center`}>
        <span className={`w-4 h-4 rounded-full ${bgColor} mr-3`}></span>
        {title} ({items.length} items)
      </h2>
      
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">🎵</div>
          <p>No {title.toLowerCase()} in your collection yet</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🎵 Music Collection</h1>
              <p className="text-gray-600 mt-1">Organize your CDs and vinyl records</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              + Add New Item
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Item</h2>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Artist</label>
                <input
                  type="text"
                  name="artist"
                  value={formData.artist}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter artist name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Album Title</label>
                <input
                  type="text"
                  name="album_title"
                  value={formData.album_title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter album title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year of Release</label>
                <input
                  type="number"
                  name="year_of_release"
                  value={formData.year_of_release}
                  onChange={handleInputChange}
                  required
                  min="1900"
                  max="2030"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. 1975"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                <input
                  type="text"
                  name="genre"
                  value={formData.genre}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Rock, Jazz, Pop"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Date</label>
                <input
                  type="date"
                  name="purchase_date"
                  value={formData.purchase_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                <select
                  name="format"
                  value={formData.format}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="CD">CD</option>
                  <option value="LP">LP (Vinyl)</option>
                </select>
              </div>

              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add to Collection'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Collection Sections */}
        <CollectionSection 
          title="CD Collection" 
          items={cdItems} 
          bgColor="bg-blue-500"
          textColor="text-blue-800"
        />
        
        <CollectionSection 
          title="LP Collection" 
          items={lpItems} 
          bgColor="bg-purple-500"
          textColor="text-purple-800"
        />

        {/* Empty State */}
        {items.length === 0 && (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">🎵</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Start Your Music Collection</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Add your first CD or LP to begin cataloging your music collection. 
              Keep track of your favorite albums, artists, and purchase history.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              Add Your First Item
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;