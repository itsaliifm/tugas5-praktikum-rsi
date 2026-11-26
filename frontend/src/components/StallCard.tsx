// Kartu satu warung pada halaman daftar warung.
import { Link } from 'react-router-dom';
import type { Stall } from '../types/stall';

interface StallCardProps {
  stall: Stall;
  isMine: boolean;
}

function StallCard({ stall, isMine }: StallCardProps) {
  return (
    <Link to={`/stalls/${stall.id}`} className="stall-card">
      <div className="stall-top">
        <span className="badge badge-category">
          {stall.category || 'Lainnya'}
        </span>

        <div className="stall-badges">
          {isMine ? <span className="badge badge-mine">Milik saya</span> : null}
          {stall.isPopular ? <span className="badge badge-popular">Populer</span> : null}
        </div>
      </div>

      <h3>{stall.name}</h3>

      <p className="stall-description">
        {stall.description || 'Tidak ada deskripsi.'}
      </p>

      <div className="stall-info">
        <span>{stall.location || 'Lokasi belum tersedia'}</span>
        <span>
          ⭐ {stall.avgRating.toFixed(1)}{' '}
          <small>({stall.reviewCount} ulasan)</small>
        </span>
      </div>
    </Link>
  );
}

export default StallCard;
