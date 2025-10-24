import { pinataConfig } from "../contracts/config";

export const uploadToPinata = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "pinataMetadata",
      JSON.stringify({
        name: file.name,
      })
    );
    formData.append(
      "pinataOptions",
      JSON.stringify({
        cidVersion: 0,
      })
    );

    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pinataConfig.jwt}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to upload to Pinata");
    }

    const result = await response.json();
    return {
      hash: result.IpfsHash,
      url: `${pinataConfig.gatewayUrl}${result.IpfsHash}`,
    };
  } catch (error) {
    throw new Error(`Pinata upload failed: ${error.message}`);
  }
};

export const uploadMetadataToPinata = async (metadata) => {
  try {
    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pinataConfig.jwt}`,
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: {
            name: `NFT Metadata - ${metadata.name}`,
          },
          pinataOptions: {
            cidVersion: 0,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to upload metadata to Pinata");
    }

    const result = await response.json();
    return {
      hash: result.IpfsHash,
      url: `${pinataConfig.gatewayUrl}${result.IpfsHash}`,
    };
  } catch (error) {
    throw new Error(`Metadata upload failed: ${error.message}`);
  }
};

export const fetchMetadataFromIPFS = async (tokenURI) => {
  if (!tokenURI) {
    throw new Error("No token URI provided");
  }

  // Convert IPFS URI to HTTP URL
  let metadataUrl = tokenURI;

  if (tokenURI.startsWith("ipfs://")) {
    const hash = tokenURI.replace("ipfs://", "");
    metadataUrl = `https://gateway.pinata.cloud/ipfs/${hash}`;
  } else if (tokenURI.startsWith("Qm") || tokenURI.startsWith("baf")) {
    metadataUrl = `https://gateway.pinata.cloud/ipfs/${tokenURI}`;
  }

  // Array of different IPFS gateways to try
  const gateways = [
    "https://gateway.pinata.cloud/ipfs/",
    "https://ipfs.io/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
    "https://dweb.link/ipfs/",
    "https://nftstorage.link/ipfs/",
  ];

  let lastError;
  const hash = tokenURI.replace("ipfs://", "").replace(/^\/+/, "");

  // Try each gateway
  for (const gateway of gateways) {
    try {
      const url = tokenURI.startsWith("http") ? tokenURI : `${gateway}${hash}`;

      console.log(`Trying to fetch metadata from: ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // Try to parse anyway, sometimes IPFS doesn't set correct content-type
        const text = await response.text();
        try {
          const metadata = JSON.parse(text);
          console.log(`Successfully fetched metadata from: ${url}`);
          return metadata;
        } catch (parseError) {
          throw new Error(`Invalid JSON response from ${url}`);
        }
      }

      const metadata = await response.json();
      console.log(`Successfully fetched metadata from: ${url}`);
      return metadata;
    } catch (error) {
      console.warn(`Failed to fetch from ${gateway}: ${error.message}`);
      lastError = error;
      continue;
    }
  }

  // If all gateways fail, return a fallback metadata object
  console.error(
    `Failed to fetch metadata from all gateways. Last error: ${lastError?.message}`
  );

  // Extract token ID from URI if possible for fallback name
  const tokenIdMatch = tokenURI.match(/(\d+)/) || [];
  const tokenId = tokenIdMatch[0] || "Unknown";

  return {
    name: `NFT #${tokenId}`,
    description:
      "Metadata temporarily unavailable. This may be due to IPFS network issues.",
    image: "", // No image available
    attributes: [],
    collection: "Unknown Collection",
    error: true,
    originalURI: tokenURI,
  };
};

// Helper function to validate metadata structure
export const validateMetadata = (metadata) => {
  const requiredFields = ["name"];
  const validMetadata = { ...metadata };

  // Ensure required fields exist
  requiredFields.forEach((field) => {
    if (!validMetadata[field]) {
      validMetadata[field] = `Unknown ${field}`;
    }
  });

  // Ensure optional fields have defaults
  if (!validMetadata.description) validMetadata.description = "";
  if (!validMetadata.image) validMetadata.image = "";
  if (!validMetadata.attributes) validMetadata.attributes = [];
  if (!validMetadata.collection)
    validMetadata.collection = "Unnamed Collection";

  return validMetadata;
};

// Helper function to get image URL with fallbacks
export const getImageUrl = (imageUri) => {
  if (!imageUri) return "";

  if (imageUri.startsWith("ipfs://")) {
    const hash = imageUri.replace("ipfs://", "");
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }

  if (imageUri.startsWith("Qm") || imageUri.startsWith("baf")) {
    return `https://gateway.pinata.cloud/ipfs/${imageUri}`;
  }

  if (imageUri.startsWith("http")) {
    return imageUri;
  }

  // If it's a relative path, assume it's an IPFS hash
  return `https://gateway.pinata.cloud/ipfs/${imageUri}`;
};
