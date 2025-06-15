/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

const WIKIPEDIA_API_BASE_URL = 'https://pt.wikipedia.org/w/api.php';
const MINIMUM_EXTRACT_LENGTH = 300; // Minimum characters for a "sufficient" extract

interface WikipediaPage {
  pageid: number;
  ns: number;
  title: string;
  extract: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  pageimage?: string;
  missing?: boolean; // Indicates if the page is missing
  pageprops?: {
    disambiguation?: string; // Indicates if the page is a disambiguation page
  };
}

interface WikipediaQuery {
  pages: {
    [pageId: string]: WikipediaPage;
  };
}

interface WikipediaResponse {
  batchcomplete: string;
  query: WikipediaQuery;
}

export enum WikipediaFetchStatus {
  SUCCESS,
  NOT_FOUND,
  AMBIGUOUS,
  INSUFFICIENT_CONTENT,
  API_ERROR,
}

export interface WikipediaData {
  title: string;
  extract: string;
  imageUrl?: string;
}

export interface WikipediaAPIResult {
  status: WikipediaFetchStatus;
  data?: WikipediaData;
  searchTerm?: string;
}

/**
 * Fetches data (title, full extract, and main image URL) of a Wikipedia page.
 * @param searchTerm The term to search for (e.g., a personality's name).
 * @returns A promise that resolves to an object with status and optionally data.
 */
export async function fetchWikipediaData(
  searchTerm: string
): Promise<WikipediaAPIResult> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'extracts|pageimages|pageprops', // Get extracts, page images, and page properties
    explaintext: 'true', // Get plain text for extract, not HTML
    piprop: 'thumbnail|name',
    pithumbsize: '500',
    redirects: '1', // Follow redirects
    titles: searchTerm,
    origin: '*', // Necessary for CORS
  });

  try {
    const response = await fetch(`${WIKIPEDIA_API_BASE_URL}?${params.toString()}`);
    if (!response.ok) {
      console.error('Wikipedia API request failed:', response.statusText);
      return { status: WikipediaFetchStatus.API_ERROR, searchTerm };
    }

    const apiResponse = (await response.json()) as WikipediaResponse;
    const pages = apiResponse.query.pages;
    const pageId = Object.keys(pages)[0]; // Should be the first and only pageId due to 'titles' or resolved redirect
    
    // If pageId is -1 or pages is empty, it means the search term didn't resolve to a page.
    // This can happen if the title doesn't exist even after redirects.
    if (!pageId || pageId === '-1' || !pages[pageId]) {
      console.log(`Wikipedia page for "${searchTerm}" not found (pageId: ${pageId}).`);
      return { status: WikipediaFetchStatus.NOT_FOUND, searchTerm };
    }

    const pageData = pages[pageId];

    if (pageData.missing) {
      console.log(`Wikipedia page for "${searchTerm}" not found (marked as missing).`);
      return { status: WikipediaFetchStatus.NOT_FOUND, searchTerm };
    }

    if (pageData.pageprops?.disambiguation !== undefined) {
      console.log(`Wikipedia page for "${searchTerm}" is a disambiguation page.`);
      return { status: WikipediaFetchStatus.AMBIGUOUS, searchTerm };
    }

    if (!pageData.extract || pageData.extract.length < MINIMUM_EXTRACT_LENGTH) {
      console.log(
        `Wikipedia page for "${searchTerm}" found, but extract is missing or too short (length: ${pageData.extract?.length || 0}).`
      );
      return { status: WikipediaFetchStatus.INSUFFICIENT_CONTENT, searchTerm };
    }
    
    return {
      status: WikipediaFetchStatus.SUCCESS,
      data: {
        title: pageData.title,
        extract: pageData.extract,
        imageUrl: pageData.thumbnail?.source,
      },
      searchTerm
    };
  } catch (error) {
    console.error('Error fetching Wikipedia data:', error);
    return { status: WikipediaFetchStatus.API_ERROR, searchTerm };
  }
}