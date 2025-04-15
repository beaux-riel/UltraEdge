import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSupabase } from './SupabaseContext';
import { generateUUID } from '../utils/helpers';

// Define note types
export const NOTE_TYPES = {
  RACE: 'race',
  GEAR: 'gear',
  NUTRITION: 'nutrition',
  HYDRATION: 'hydration',
  DROP_BAG: 'drop_bag',
  CREW: 'crew',
  AID_STATION: 'aid_station',
  COURSE: 'course',
  GENERAL: 'general'
};

// Create the context
const NotesContext = createContext();

export const NotesProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { 
    user, 
    isPremium, 
    supabase, 
    saveNoteToSupabase, 
    deleteNoteFromSupabase, 
    fetchNotesFromSupabase, 
    checkAndFetchData 
  } = useSupabase();

  // Load notes from storage on mount
  useEffect(() => {
    const loadNotes = async () => {
      try {
        setLoading(true);
        
        // Try to restore from Supabase first if user is premium
        if (user && isPremium && supabase) {
          await checkAndFetchData('notes');
          const notesData = await fetchNotesFromSupabase();
          
          if (notesData && notesData.length > 0) {
            setNotes(notesData);
            await AsyncStorage.setItem('notes', JSON.stringify(notesData));
            setLoading(false);
            return;
          }
        }
        
        // Fall back to AsyncStorage
        const storedNotes = await AsyncStorage.getItem('notes');
        if (storedNotes) {
          const parsedNotes = JSON.parse(storedNotes);
          setNotes(parsedNotes);
        }
      } catch (error) {
        console.error('Failed to load notes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [user, isPremium, supabase, checkAndFetchData, fetchNotesFromSupabase]);

  // Save notes to AsyncStorage and optionally to Supabase
  const saveNotes = async (updatedNotes) => {
    try {
      setNotes(updatedNotes);
      await AsyncStorage.setItem('notes', JSON.stringify(updatedNotes));
      
      // Backup to Supabase if user is premium
      if (user && isPremium && supabase) {
        await backupNotesToSupabase(updatedNotes);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to save notes:', error);
      return { success: false, error };
    }
  };

  // Backup notes to Supabase
  const backupNotesToSupabase = async (notesToBackup = null) => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      if (!user) throw new Error('User not authenticated');
      if (!isPremium) throw new Error('Premium subscription required for Supabase sync');
      
      const notesArray = notesToBackup || notes;
      
      // Save each note individually using the saveNoteToSupabase function
      for (const note of notesArray) {
        await saveNoteToSupabase(note);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error backing up notes to Supabase:', error);
      return { success: false, error: error.message };
    }
  };

  // Add a new note
  const addNote = async (content, entityType, entityId, title = '') => {
    try {
      const newNote = {
        id: generateUUID(),
        entityType: entityType,
        entityId: entityId,
        title: title,
        content: content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save to local state and AsyncStorage
      const updatedNotes = [...notes, newNote];
      await saveNotes(updatedNotes);
      
      // If premium, also save to Supabase directly
      if (user && isPremium && supabase) {
        await saveNoteToSupabase(newNote);
      }
      
      return { success: true, note: newNote };
    } catch (error) {
      console.error('Failed to add note:', error);
      return { success: false, error };
    }
  };

  // Update an existing note
  const updateNote = async (noteId, updates) => {
    try {
      const noteToUpdate = notes.find(note => note.id === noteId);
      if (!noteToUpdate) {
        throw new Error(`Note with ID ${noteId} not found`);
      }
      
      const updatedNote = { 
        ...noteToUpdate, 
        ...updates, 
        updatedAt: new Date().toISOString() 
      };
      
      const updatedNotes = notes.map(note => 
        note.id === noteId ? updatedNote : note
      );
      
      // Update local state and AsyncStorage
      await saveNotes(updatedNotes);
      
      // If premium, also update in Supabase directly
      if (user && isPremium && supabase) {
        await saveNoteToSupabase(updatedNote);
      }
      
      return { success: true, note: updatedNote };
    } catch (error) {
      console.error('Failed to update note:', error);
      return { success: false, error };
    }
  };

  // Delete a note
  const deleteNote = async (noteId) => {
    try {
      // Update local state and AsyncStorage
      const updatedNotes = notes.filter(note => note.id !== noteId);
      await saveNotes(updatedNotes);
      
      // If user is premium, also delete from Supabase
      if (user && isPremium && supabase) {
        await deleteNoteFromSupabase(noteId);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to delete note:', error);
      return { success: false, error };
    }
  };

  // Get notes for a specific entity
  const getNotesForEntity = (entityType, entityId) => {
    return notes.filter(
      note => note.entityType === entityType && note.entityId === entityId
    );
  };

  return (
    <NotesContext.Provider value={{
      notes,
      loading,
      addNote,
      updateNote,
      deleteNote,
      getNotesForEntity,
      backupNotesToSupabase
    }}>
      {children}
    </NotesContext.Provider>
  );
};

// Custom hook to use the notes context
export const useNotes = () => useContext(NotesContext);

export default NotesContext;