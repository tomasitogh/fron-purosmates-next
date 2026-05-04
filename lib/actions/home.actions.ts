'use server';

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL 
    ? process.env.NEXT_PUBLIC_API_BASE_URL 
    : 'http://localhost:8080';

export interface Banner {
    id: number;
    imageUrl: string;
    altText?: string;
    link?: string;
    active: boolean;
    displayOrder: number;
}

export interface HomeCategory {
    id: number;
    description: string;
    imageUrl?: string;
    link?: string;
    showOnHome: boolean;
    displayOrder: number;
    active: boolean;
}

export interface ProductCategory {
    id: number;
    description: string;
    active: boolean;
}

export async function getBanners(): Promise<Banner[]> {
    try {
        const { data } = await axios.get(`${API_URL}/banners`);
        return data;
    } catch (error) {
        console.error('Error fetching banners:', error);
        return [];
    }
}

export async function getAllBanners(): Promise<Banner[]> {
    try {
        const { data } = await axios.get(`${API_URL}/banners/all`);
        return data;
    } catch (error) {
        console.error('Error fetching all banners:', error);
        return [];
    }
}

export async function createBanner(data: {
    imageUrl: string;
    altText?: string;
    link?: string;
    displayOrder?: number;
}, token: string) {
    try {
        const response = await axios.post(`${API_URL}/banners`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Error creating banner:', error);
        throw error;
    }
}

export async function updateBanner(id: number, data: {
    imageUrl?: string;
    altText?: string;
    link?: string;
    active?: boolean;
    displayOrder?: number;
}, token: string) {
    try {
        const response = await axios.put(`${API_URL}/banners/${id}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Error updating banner:', error);
        throw error;
    }
}

export async function deleteBanner(id: number, token: string) {
    try {
        await axios.delete(`${API_URL}/banners/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return { success: true };
    } catch (error) {
        console.error('Error deleting banner:', error);
        throw error;
    }
}

export async function getHomeCategories(): Promise<HomeCategory[]> {
    try {
        const { data } = await axios.get(`${API_URL}/categories/home`);
        return data;
    } catch (error) {
        console.error('Error fetching home categories:', error);
        return [];
    }
}

export async function updateCategoryHome(
    id: number, 
    data: {
        description?: string;
        imageUrl?: string;
        link?: string;
        showOnHome?: boolean;
        displayOrder?: number;
        active?: boolean;
    }, 
    token: string
) {
    try {
        const response = await axios.post(`${API_URL}/categories/home/${id}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Error updating category home:', error);
        throw error;
    }
}

export async function createHomeCategory(
    data: {
        description: string;
        imageUrl?: string;
        link?: string;
        showOnHome?: boolean;
        displayOrder?: number;
    },
    token: string
) {
    try {
        const response = await axios.post(`${API_URL}/categories/full`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Error creating home category:', error);
        throw error;
    }
}

export async function deleteHomeCategory(id: number, token: string) {
    try {
        await axios.delete(`${API_URL}/categories/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return { success: true };
    } catch (error) {
        console.error('Error deleting home category:', error);
        throw error;
    }
}

export async function getAllCategories(): Promise<ProductCategory[]> {
    try {
        console.log('Fetching categories from:', `${API_URL}/categories`);
        const { data } = await axios.get(`${API_URL}/categories?page=0&size=50`);
        console.log('Categories response:', data);
        const content = data.content || data;
        if (Array.isArray(content)) {
            return content;
        }
        return [];
    } catch (error: any) {
        console.error('Error fetching all categories:', error?.response?.status, error?.message);
        return [];
    }
}

export async function createProductCategory(description: string, token: string) {
    try {
        const response = await axios.post(`${API_URL}/categories`, { description }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Error creating product category:', error);
        throw error;
    }
}

export async function updateProductCategory(id: number, data: { description?: string; active?: boolean }, token: string) {
    try {
        const response = await axios.put(`${API_URL}/categories/${id}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Error updating product category:', error);
        throw error;
    }
}

export async function deleteProductCategory(id: number, token: string) {
    try {
        await axios.delete(`${API_URL}/categories/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return { success: true };
    } catch (error) {
        console.error('Error deleting product category:', error);
        throw error;
    }
}