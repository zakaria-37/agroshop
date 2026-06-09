from flask import Flask, render_template, request, jsonify, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from datetime import datetime, timedelta
import json, os, jwt

app = Flask(__name__)
app.config['SECRET_KEY'] = 'agroshop-secret-key-2024-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///agroshop.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ─── MODELS ──────────────────────────────────────────────────────────────────

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    orders = db.relationship('Order', backref='user', lazy=True)

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    icon = db.Column(db.String(50), default='fa-leaf')
    slug = db.Column(db.String(80), unique=True, nullable=False)
    products = db.relationship('Product', backref='category', lazy=True)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Float, nullable=False)
    stock = db.Column(db.Integer, default=0)
    image_url = db.Column(db.String(300), default='')
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    featured = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    order_items = db.relationship('OrderItem', backref='product', lazy=True)

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    total = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(30), default='pending')
    address = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    items = db.relationship('OrderItem', backref='order', lazy=True)

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)

# ─── AUTH HELPERS ─────────────────────────────────────────────────────────────

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            flash('Veuillez vous connecter pour continuer.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        user = User.query.get(session['user_id'])
        if not user or not user.is_admin:
            flash('Accès administrateur requis.', 'danger')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated

def generate_token(user_id):
    payload = {'user_id': user_id, 'exp': datetime.utcnow() + timedelta(days=7)}
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

# ─── USER ROUTES ──────────────────────────────────────────────────────────────

@app.route('/')
def index():
    categories = Category.query.all()
    featured = Product.query.filter_by(featured=True).limit(8).all()
    new_arrivals = Product.query.order_by(Product.created_at.desc()).limit(8).all()
    return render_template('user/index.html', categories=categories,
                           featured=featured, new_arrivals=new_arrivals)

@app.route('/products')
def products():
    q = request.args.get('q', '')
    cat = request.args.get('category', '')
    sort = request.args.get('sort', 'newest')
    page = request.args.get('page', 1, type=int)

    query = Product.query
    if q:
        query = query.filter(Product.name.ilike(f'%{q}%') |
                             Product.description.ilike(f'%{q}%'))
    if cat:
        category = Category.query.filter_by(slug=cat).first()
        if category:
            query = query.filter_by(category_id=category.id)
    if sort == 'price_asc':
        query = query.order_by(Product.price.asc())
    elif sort == 'price_desc':
        query = query.order_by(Product.price.desc())
    else:
        query = query.order_by(Product.created_at.desc())

    pagination = query.paginate(page=page, per_page=12, error_out=False)
    categories = Category.query.all()
    return render_template('user/products.html', products=pagination.items,
                           pagination=pagination, categories=categories,
                           current_q=q, current_cat=cat, current_sort=sort)

@app.route('/product/<int:pid>')
def product_detail(pid):
    product = Product.query.get_or_404(pid)
    related = Product.query.filter_by(category_id=product.category_id)\
                           .filter(Product.id != pid).limit(4).all()
    return render_template('user/product_detail.html', product=product, related=related)

@app.route('/cart')
@login_required
def cart():
    return render_template('user/cart.html')

@app.route('/checkout', methods=['GET', 'POST'])
@login_required
def checkout():
    if request.method == 'POST':
        data = request.get_json()
        items = data.get('items', [])
        address = data.get('address', '')
        if not items:
            return jsonify({'success': False, 'message': 'Le panier est vide'}), 400
        total = 0
        order = Order(user_id=session['user_id'], total=0, address=address)
        db.session.add(order)
        db.session.flush()
        for item in items:
            product = Product.query.get(item['id'])
            if product and product.stock >= item['qty']:
                oi = OrderItem(order_id=order.id, product_id=product.id,
                               quantity=item['qty'], price=product.price)
                db.session.add(oi)
                product.stock -= item['qty']
                total += product.price * item['qty']
            else:
                db.session.rollback()
                return jsonify({'success': False, 'message': f'Stock insuffisant pour {product.name if product else "le produit"}'}), 400
        order.total = total
        db.session.commit()
        return jsonify({'success': True, 'order_id': order.id})
    return render_template('user/checkout.html')

@app.route('/orders')
@login_required
def my_orders():
    orders = Order.query.filter_by(user_id=session['user_id'])\
                        .order_by(Order.created_at.desc()).all()
    return render_template('user/orders.html', orders=orders)

@app.route('/order/<int:oid>')
@login_required
def order_detail(oid):
    order = Order.query.get_or_404(oid)
    if order.user_id != session['user_id'] and not session.get('is_admin'):
        flash('Accès refusé.', 'danger')
        return redirect(url_for('my_orders'))
    return render_template('user/order_detail.html', order=order)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'user_id' in session:
        return redirect(url_for('index'))
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            session['user_name'] = user.name
            session['is_admin'] = user.is_admin
            flash(f'Bienvenue, {user.name} !', 'success')
            next_page = request.args.get('next')
            if user.is_admin:
                return redirect(next_page or url_for('admin_dashboard'))
            return redirect(next_page or url_for('index'))
        flash('Email ou mot de passe incorrect.', 'danger')
    return render_template('user/login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if 'user_id' in session:
        return redirect(url_for('index'))
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        if User.query.filter_by(email=email).first():
            flash('Cet email est déjà enregistré.', 'danger')
        else:
            user = User(name=name, email=email,
                        password=generate_password_hash(password))
            db.session.add(user)
            db.session.commit()
            session['user_id'] = user.id
            session['user_name'] = user.name
            session['is_admin'] = False
            flash('Compte créé ! Bienvenue sur AgroShop.', 'success')
            return redirect(url_for('index'))
    return render_template('user/register.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('Déconnexion réussie.', 'info')
    return redirect(url_for('index'))

# ─── API ROUTES ───────────────────────────────────────────────────────────────

@app.route('/api/products', methods=['GET'])
def api_products():
    products = Product.query.all()
    return jsonify([{
        'id': p.id, 'name': p.name, 'price': p.price,
        'stock': p.stock, 'image_url': p.image_url,
        'category': p.category.name
    } for p in products])

@app.route('/api/products/<int:pid>', methods=['GET'])
def api_product(pid):
    p = Product.query.get_or_404(pid)
    return jsonify({
        'id': p.id, 'name': p.name, 'description': p.description,
        'price': p.price, 'stock': p.stock, 'image_url': p.image_url,
        'category': p.category.name, 'featured': p.featured
    })

@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email exists'}), 400
    user = User(name=data['name'], email=data['email'],
                password=generate_password_hash(data['password']))
    db.session.add(user)
    db.session.commit()
    token = generate_token(user.id)
    return jsonify({'token': token, 'user': {'id': user.id, 'name': user.name}}), 201

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if user and check_password_hash(user.password, data['password']):
        token = generate_token(user.id)
        return jsonify({'token': token, 'user': {'id': user.id, 'name': user.name, 'is_admin': user.is_admin}})
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/orders', methods=['GET'])
def api_orders():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    orders = Order.query.filter_by(user_id=session['user_id']).all()
    return jsonify([{
        'id': o.id, 'total': o.total, 'status': o.status,
        'created_at': o.created_at.isoformat()
    } for o in orders])

@app.route('/api/admin/stats', methods=['GET'])
def api_admin_stats():
    if not session.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 403
    total_revenue = db.session.query(db.func.sum(Order.total)).scalar() or 0
    total_orders = Order.query.count()
    total_users = User.query.filter_by(is_admin=False).count()
    total_products = Product.query.count()

    # Monthly sales for chart (last 6 months)
    monthly = []
    for i in range(5, -1, -1):
        d = datetime.utcnow() - timedelta(days=30*i)
        month_start = d.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if d.month == 12:
            month_end = d.replace(year=d.year+1, month=1, day=1)
        else:
            month_end = d.replace(month=d.month+1, day=1)
        rev = db.session.query(db.func.sum(Order.total))\
                        .filter(Order.created_at >= month_start,
                                Order.created_at < month_end).scalar() or 0
        monthly.append({'month': d.strftime('%b %Y'), 'revenue': float(rev)})

    # Category distribution
    cat_stats = []
    for cat in Category.query.all():
        count = Product.query.filter_by(category_id=cat.id).count()
        cat_stats.append({'name': cat.name, 'count': count})

    return jsonify({
        'total_revenue': float(total_revenue),
        'total_orders': total_orders,
        'total_users': total_users,
        'total_products': total_products,
        'monthly_sales': monthly,
        'category_distribution': cat_stats
    })

# ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

@app.route('/admin')
@admin_required
def admin_dashboard():
    total_revenue = db.session.query(db.func.sum(Order.total)).scalar() or 0
    total_orders = Order.query.count()
    total_users = User.query.filter_by(is_admin=False).count()
    total_products = Product.query.count()
    recent_orders = Order.query.order_by(Order.created_at.desc()).limit(5).all()
    return render_template('admin/dashboard.html',
                           total_revenue=total_revenue,
                           total_orders=total_orders,
                           total_users=total_users,
                           total_products=total_products,
                           recent_orders=recent_orders)

@app.route('/admin/products')
@admin_required
def admin_products():
    products = Product.query.order_by(Product.created_at.desc()).all()
    categories = Category.query.all()
    return render_template('admin/products.html', products=products, categories=categories)

@app.route('/admin/products/add', methods=['POST'])
@admin_required
def admin_add_product():
    p = Product(
        name=request.form['name'],
        description=request.form['description'],
        price=float(request.form['price']),
        stock=int(request.form['stock']),
        image_url=request.form['image_url'],
        category_id=int(request.form['category_id']),
        featured='featured' in request.form
    )
    db.session.add(p)
    db.session.commit()
    flash('Produit ajouté avec succès.', 'success')
    return redirect(url_for('admin_products'))

@app.route('/admin/products/edit/<int:pid>', methods=['POST'])
@admin_required
def admin_edit_product(pid):
    p = Product.query.get_or_404(pid)
    p.name = request.form['name']
    p.description = request.form['description']
    p.price = float(request.form['price'])
    p.stock = int(request.form['stock'])
    p.image_url = request.form['image_url']
    p.category_id = int(request.form['category_id'])
    p.featured = 'featured' in request.form
    db.session.commit()
    flash('Produit mis à jour avec succès.', 'success')
    return redirect(url_for('admin_products'))

@app.route('/admin/products/delete/<int:pid>', methods=['POST'])
@admin_required
def admin_delete_product(pid):
    p = Product.query.get_or_404(pid)
    db.session.delete(p)
    db.session.commit()
    flash('Produit supprimé.', 'success')
    return redirect(url_for('admin_products'))

@app.route('/admin/orders')
@admin_required
def admin_orders():
    status_filter = request.args.get('status', '')
    query = Order.query.order_by(Order.created_at.desc())
    if status_filter:
        query = query.filter_by(status=status_filter)
    orders = query.all()
    return render_template('admin/orders.html', orders=orders, current_status=status_filter)

@app.route('/admin/orders/<int:oid>/status', methods=['POST'])
@admin_required
def admin_update_order_status(oid):
    order = Order.query.get_or_404(oid)
    order.status = request.form['status']
    db.session.commit()
    flash('Statut de la commande mis à jour.', 'success')
    return redirect(url_for('admin_orders'))

@app.route('/admin/users')
@admin_required
def admin_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return render_template('admin/users.html', users=users)

@app.route('/admin/stats')
@admin_required
def admin_stats():
    return render_template('admin/stats.html')

# ─── SEED DATABASE ────────────────────────────────────────────────────────────

def seed_db():
    if Category.query.count() > 0:
        return
    categories = [
        Category(name='Engrais', icon='fa-flask', slug='fertilizers'),
        Category(name='Pesticides', icon='fa-bug', slug='pesticides'),
        Category(name='Semences', icon='fa-seedling', slug='seeds'),
        Category(name='Outils Agricoles', icon='fa-tools', slug='tools'),
        Category(name='Nutriments du Sol', icon='fa-mountain', slug='soil-nutrients'),
    ]
    for c in categories:
        db.session.add(c)
    db.session.flush()

    cat_map = {c.slug: c.id for c in categories}

    products = [
        # Fertilizers
        Product(name='Engrais NPK 20-20-20', description='Engrais polyvalent équilibré idéal pour légumes, fleurs et cultures. Favorise le développement racinaire, un feuillage luxuriant et une fructification abondante. Contient azote, phosphore et potassium en proportions égales.', price=3374, stock=150, image_url='https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80', category_id=cat_map['fertilizers'], featured=True),
        Product(name='Compost Organique Mixte', description='Compost organique riche issu de matières végétales. Améliore la structure du sol, la rétention d\'eau et l\'activité microbienne. Idéal pour l\'agriculture biologique et les jardins familiaux.', price=2498, stock=200, image_url='https://images.unsplash.com/photo-1585059895524-72359e06133a?w=400&q=80', category_id=cat_map['fertilizers'], featured=True),
        Product(name='Urée 46% Azote', description='Engrais azoté à haute concentration pour un verdissement rapide. Formule à action rapide pour les sols carencés. Convient à toutes les grandes cultures.', price=4320, stock=100, image_url='https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80', category_id=cat_map['fertilizers']),
        Product(name='Engrais DAP 18-46-0', description='Phosphate di-ammonique pour le développement racinaire et la croissance précoce. Excellent engrais de départ pour les céréales. Soluble dans l\'eau pour une absorption rapide.', price=3881, stock=120, image_url='https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80', category_id=cat_map['fertilizers']),
        # Pesticides
        Product(name='Insecticide BioGuard 500ml', description='Insecticide biologique à large spectre contre les pucerons, aleurodes, thrips et acariens. Sans danger pour les insectes utiles. Ne laisse aucun résidu nocif.', price=2159, stock=80, image_url='https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80', category_id=cat_map['pesticides'], featured=True),
        Product(name='Fongicide FungoClear 1L', description='Fongicide systémique pour la prévention et le traitement de l\'oïdium, la tache noire, la rouille et le mildiou. Protège les cultures jusqu\'à 14 jours en une seule application.', price=3038, stock=60, image_url='https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=400&q=80', category_id=cat_map['pesticides']),
        Product(name='Herbicide HerbaClear 2L', description='Herbicide sélectif ciblant les mauvaises herbes à larges feuilles sans nuire aux graminées. Non persistant dans le sol. Sans danger autour des points d\'eau après séchage.', price=2699, stock=90, image_url='https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80', category_id=cat_map['pesticides']),
        # Seeds
        Product(name='Semences Tomate Hybride (100g)', description='Semences de tomate hybride à haut rendement, résistantes aux maladies. Produit de gros fruits fermes idéaux pour le marché frais. Germination en 5-7 jours dans des conditions optimales.', price=1214, stock=300, image_url='https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400&q=80', category_id=cat_map['seeds'], featured=True),
        Product(name='Semences Maïs Doux 500g', description='Variété premium de maïs doux à haute teneur en sucre. Taux de germination excellent de 95%+. Maturité en 75-85 jours. Idéal pour la consommation fraîche et la transformation.', price=1688, stock=250, image_url='https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&q=80', category_id=cat_map['seeds']),
        Product(name='Mélange Semences Tournesol 200g', description='Mélange multi-variétés de tournesol pour la production d\'huile et l\'ornement. Haut taux de germination. Résistant à la sécheresse. Attire les pollinisateurs bénéfiques.', price=911, stock=400, image_url='https://images.unsplash.com/photo-1504567961542-e24d9439a724?w=400&q=80', category_id=cat_map['seeds']),
        Product(name='Semences Blé Sac 5kg', description='Variété de blé certifiée résistante aux maladies pour hauts rendements. Adaptée aux conditions pluviales et irriguées. Maturité en 120-130 jours. Excellente qualité boulangère.', price=4725, stock=80, image_url='https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80', category_id=cat_map['seeds']),
        # Tools
        Product(name='Houe Professionnelle', description='Houe en acier inoxydable robuste avec manche en bois ergonomique. Parfaite pour la préparation du sol, le désherbage et le buttage. Lame anti-rouille pour de longues sessions de travail.', price=6075, stock=50, image_url='https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80', category_id=cat_map['tools'], featured=True),
        Product(name='Kit Irrigation Goutte-à-Goutte (50m)', description='Système complet de micro-irrigation pour 50 mètres. Inclut minuterie, régulateur de pression et 20 goutteurs. Économise jusqu\'à 70% d\'eau par rapport à l\'irrigation classique.', price=12149, stock=30, image_url='https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80', category_id=cat_map['tools']),
        Product(name='Pulvérisateur Manuel 16L', description='Pulvérisateur à dos haute capacité avec buse réglable. Convient aux pesticides, herbicides et engrais liquides. Cuve en polyéthylène durable avec soupape de décharge.', price=5198, stock=45, image_url='https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=400&q=80', category_id=cat_map['tools']),
        # Soil Nutrients
        Product(name='Activateur Racinaire Mycorhizien', description='Inoculant fongique mycorhizien premium pour améliorer l\'absorption racinaire. Augmente l\'absorption des nutriments jusqu\'à 400%. Excellent pour les transplants et les plantes établies.', price=4049, stock=70, image_url='https://images.unsplash.com/photo-1585059895524-72359e06133a?w=400&q=80', category_id=cat_map['soil-nutrients'], featured=True),
        Product(name='Granulés d\'Acide Humique 1kg', description='Granulés d\'acide humique concentrés pour améliorer la structure du sol. Augmente la capacité de rétention d\'eau et des nutriments. Convient à tous les types de sols.', price=2969, stock=90, image_url='https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80', category_id=cat_map['soil-nutrients']),
        Product(name='Supplément Calcium-Magnésium', description='Supplément équilibré en calcium et magnésium pour prévenir les carences. Prévient la pourriture apicale des tomates et poivrons. Renforce les parois cellulaires et améliore la qualité des fruits.', price=2228, stock=110, image_url='https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80', category_id=cat_map['soil-nutrients']),
    ]
    for p in products:
        db.session.add(p)

    admin = User(name='Admin', email='admin@agroshop.com',
                 password=generate_password_hash('admin123'), is_admin=True)
    db.session.add(admin)
    db.session.commit()
    print("✅ Base de données initialisée avec les données de démonstration.")

with app.app_context():
    db.create_all()
    seed_db()

if __name__ == '__main__':
    app.run(debug=True, port=5000)

# ─── TEMPLATE CONTEXT ─────────────────────────────────────────────────────────
@app.context_processor
def inject_globals():
    return {'now': datetime.utcnow()}
