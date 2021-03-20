import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get<Stock>(`/stock/${productId}`);
      const stock = response.data;

      const products = [...cart];
      let p = products.find((product) => product.id === productId);

      if (p) {
        if (p.amount < stock.amount) {
          p.amount++;
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(products));
          setCart(products);
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else {
        const response = await api.get<Product>(`/products/${productId}`);
        const product = response.data;

        if (stock.amount < 1) {
          toast.error('Quantidade solicitada fora de estoque');
        } else {
          product.amount = 1;
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, product]));
          setCart([...cart, product]);
        }
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter(product => product.id !== productId);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      setCart(newCart);
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const response = await api.get<Stock>(`/stock/${productId}`);
      const stock = response.data;
      const products = [...cart];

      if (products[productId].amount <= 0) {
        return;
      } else {
        if (stock.amount < 1) {
          toast.error('Quantidade solicitada fora de estoque');
        } else {
          products[productId].amount = amount;
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
          setCart(products);
        }
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
