import * as tf from '@tensorflow/tfjs';
import { FoodPrediction } from '../types';

// Food-101 class labels (simplified subset for demo)
const FOOD_LABELS = [
  'apple_pie', 'baby_back_ribs', 'baklava', 'beef_carpaccio', 'beef_tartare',
  'beet_salad', 'beignets', 'bibimbap', 'bread_pudding', 'breakfast_burrito',
  'bruschetta', 'caesar_salad', 'cannoli', 'caprese_salad', 'carrot_cake',
  'ceviche', 'cheesecake', 'cheese_plate', 'chicken_curry', 'chicken_quesadilla',
  'chicken_wings', 'chocolate_cake', 'chocolate_mousse', 'churros', 'clam_chowder',
  'club_sandwich', 'crab_cakes', 'creme_brulee', 'croque_madame', 'cup_cakes',
  'deviled_eggs', 'donuts', 'dumplings', 'eggs_benedict', 'escargots',
  'falafel', 'filet_mignon', 'fish_and_chips', 'foie_gras', 'french_fries',
  'french_onion_soup', 'french_toast', 'fried_calamari', 'fried_rice', 'frozen_yogurt',
  'garlic_bread', 'gnocchi', 'greek_salad', 'grilled_cheese_sandwich', 'grilled_salmon',
  'guacamole', 'hamburger', 'hot_and_sour_soup', 'hot_dog', 'huevos_rancheros',
  'hummus', 'ice_cream', 'lasagna', 'lobster_bisque', 'lobster_roll_sandwich',
  'macaroni_and_cheese', 'macarons', 'miso_soup', 'mussels', 'nachos',
  'omelette', 'onion_rings', 'oysters', 'pad_thai', 'paella',
  'pancakes', 'panna_cotta', 'peking_duck', 'pho', 'pizza',
  'pork_chop', 'poutine', 'prime_rib', 'pulled_pork_sandwich', 'ramen',
  'ravioli', 'red_velvet_cake', 'risotto', 'samosa', 'sashimi',
  'scallops', 'seaweed_salad', 'shrimp_and_grits', 'spaghetti_bolognese', 'spaghetti_carbonara',
  'spring_rolls', 'steak', 'strawberry_shortcake', 'sushi', 'tacos',
  'takoyaki', 'tiramisu', 'tuna_tartare', 'waffles'
];

// Map model labels to human-readable names
const LABEL_MAP: Record<string, string> = {
  'apple_pie': 'Apple Pie',
  'baby_back_ribs': 'Baby Back Ribs',
  'baklava': 'Baklava',
  'beef_carpaccio': 'Beef Carpaccio',
  'beef_tartare': 'Beef Tartare',
  'beet_salad': 'Beet Salad',
  'beignets': 'Beignets',
  'bibimbap': 'Bibimbap',
  'bread_pudding': 'Bread Pudding',
  'breakfast_burrito': 'Breakfast Burrito',
  'bruschetta': 'Bruschetta',
  'caesar_salad': 'Caesar Salad',
  'cannoli': 'Cannoli',
  'caprese_salad': 'Caprese Salad',
  'carrot_cake': 'Carrot Cake',
  'ceviche': 'Ceviche',
  'cheesecake': 'Cheesecake',
  'cheese_plate': 'Cheese Plate',
  'chicken_curry': 'Chicken Curry',
  'chicken_quesadilla': 'Chicken Quesadilla',
  'chicken_wings': 'Chicken Wings',
  'chocolate_cake': 'Chocolate Cake',
  'chocolate_mousse': 'Chocolate Mousse',
  'churros': 'Churros',
  'clam_chowder': 'Clam Chowder',
  'club_sandwich': 'Club Sandwich',
  'crab_cakes': 'Crab Cakes',
  'creme_brulee': 'Crème Brûlée',
  'croque_madame': 'Croque Madame',
  'cup_cakes': 'Cupcakes',
  'deviled_eggs': 'Deviled Eggs',
  'donuts': 'Donuts',
  'dumplings': 'Dumplings',
  'eggs_benedict': 'Eggs Benedict',
  'escargots': 'Escargots',
  'falafel': 'Falafel',
  'filet_mignon': 'Filet Mignon',
  'fish_and_chips': 'Fish and Chips',
  'foie_gras': 'Foie Gras',
  'french_fries': 'French Fries',
  'french_onion_soup': 'French Onion Soup',
  'french_toast': 'French Toast',
  'fried_calamari': 'Fried Calamari',
  'fried_rice': 'Fried Rice',
  'frozen_yogurt': 'Frozen Yogurt',
  'garlic_bread': 'Garlic Bread',
  'gnocchi': 'Gnocchi',
  'greek_salad': 'Greek Salad',
  'grilled_cheese_sandwich': 'Grilled Cheese Sandwich',
  'grilled_salmon': 'Grilled Salmon',
  'guacamole': 'Guacamole',
  'hamburger': 'Hamburger',
  'hot_and_sour_soup': 'Hot and Sour Soup',
  'hot_dog': 'Hot Dog',
  'huevos_rancheros': 'Huevos Rancheros',
  'hummus': 'Hummus',
  'ice_cream': 'Ice Cream',
  'lasagna': 'Lasagna',
  'lobster_bisque': 'Lobster Bisque',
  'lobster_roll_sandwich': 'Lobster Roll Sandwich',
  'macaroni_and_cheese': 'Macaroni and Cheese',
  'macarons': 'Macarons',
  'miso_soup': 'Miso Soup',
  'mussels': 'Mussels',
  'nachos': 'Nachos',
  'omelette': 'Omelette',
  'onion_rings': 'Onion Rings',
  'oysters': 'Oysters',
  'pad_thai': 'Pad Thai',
  'paella': 'Paella',
  'pancakes': 'Pancakes',
  'panna_cotta': 'Panna Cotta',
  'peking_duck': 'Peking Duck',
  'pho': 'Pho',
  'pizza': 'Pizza',
  'pork_chop': 'Pork Chop',
  'poutine': 'Poutine',
  'prime_rib': 'Prime Rib',
  'pulled_pork_sandwich': 'Pulled Pork Sandwich',
  'ramen': 'Ramen',
  'ravioli': 'Ravioli',
  'red_velvet_cake': 'Red Velvet Cake',
  'risotto': 'Risotto',
  'samosa': 'Samosa',
  'sashimi': 'Sashimi',
  'scallops': 'Scallops',
  'seaweed_salad': 'Seaweed Salad',
  'shrimp_and_grits': 'Shrimp and Grits',
  'spaghetti_bolognese': 'Spaghetti Bolognese',
  'spaghetti_carbonara': 'Spaghetti Carbonara',
  'spring_rolls': 'Spring Rolls',
  'steak': 'Steak',
  'strawberry_shortcake': 'Strawberry Shortcake',
  'sushi': 'Sushi',
  'tacos': 'Tacos',
  'takoyaki': 'Takoyaki',
  'tiramisu': 'Tiramisu',
  'tuna_tartare': 'Tuna Tartare',
  'waffles': 'Waffles'
};

let model: tf.LayersModel | null = null;
let isModelLoading = false;

export async function loadModel(): Promise<void> {
  if (model || isModelLoading) {
    return;
  }

  isModelLoading = true;
  
  try {
    // For demo purposes, we'll use MobileNetV2 as a base model
    // In production, you would load a fine-tuned Food-101 model
    console.log('Loading TensorFlow.js model...');
    
    // Load MobileNetV2 as a base model for demonstration
    // In a real implementation, you would load a Food-101 fine-tuned model
    model = await tf.loadLayersModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v2_1.0_224/model.json');
    
    console.log('Model loaded successfully');
  } catch (error) {
    console.error('Failed to load model:', error);
    throw new Error('Failed to load AI model. Please check your internet connection and try again.');
  } finally {
    isModelLoading = false;
  }
}

export async function predictFood(imageElement: HTMLImageElement): Promise<FoodPrediction[]> {
  if (!model) {
    await loadModel();
  }

  if (!model) {
    throw new Error('Model not loaded');
  }

  try {
    // Preprocess the image
    const tensor = tf.browser.fromPixels(imageElement)
      .resizeNearestNeighbor([224, 224])
      .expandDims(0)
      .div(255.0);

    // Get predictions
    const predictions = model.predict(tensor) as tf.Tensor;
    const predictionArray = await predictions.data();

    // Convert to FoodPrediction objects
    const results: FoodPrediction[] = [];
    
    // For demo purposes, we'll simulate food predictions
    // In a real implementation, you would map the model outputs to food labels
    const mockPredictions = [
      { label: 'pizza', confidence: 0.85 },
      { label: 'hamburger', confidence: 0.72 },
      { label: 'pasta', confidence: 0.68 }
    ];

    for (const pred of mockPredictions) {
      if (LABEL_MAP[pred.label]) {
        results.push({
          label: pred.label,
          confidence: pred.confidence,
          displayName: LABEL_MAP[pred.label]
        });
      }
    }

    // Clean up tensors
    tensor.dispose();
    predictions.dispose();

    return results.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  } catch (error) {
    console.error('Prediction failed:', error);
    throw new Error('Failed to analyze image. Please try again.');
  }
}

export function isModelLoaded(): boolean {
  return model !== null;
}

export function getModelLoadingState(): boolean {
  return isModelLoading;
}