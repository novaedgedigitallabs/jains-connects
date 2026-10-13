import 'package:flutter/material.dart';

import '../api/temple_api_client.dart';
import '../models/public_temple.dart';
import '../theme/app_theme.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key, required this.apiClient});

  final TempleApiClient apiClient;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('JainConnect'),
        actions: [
          IconButton(
            onPressed: () {},
            tooltip: 'Notifications',
            icon: const Icon(Icons.notifications_none_outlined),
          ),
        ],
      ),
      body: _buildBody(),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) =>
            setState(() => _selectedIndex = index),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'),
          NavigationDestination(
            icon: Icon(Icons.explore_outlined),
            label: 'Discover',
          ),
          NavigationDestination(
            icon: Icon(Icons.volunteer_activism_outlined),
            label: 'Seva',
          ),
          NavigationDestination(
            icon: Icon(Icons.event_outlined),
            label: 'Events',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    switch (_selectedIndex) {
      case 1:
        return DiscoverPage(apiClient: widget.apiClient);
      case 2:
        return const _UnavailableFeaturePage(
          icon: Icons.volunteer_activism_outlined,
          title: 'Seva and community help',
          message:
              'Seva directories will appear after their review and moderation workflows are ready.',
        );
      case 3:
        return const _UnavailableFeaturePage(
          icon: Icons.event_outlined,
          title: 'Events and Jain calendar',
          message:
              'Events and calendar resources will be added with source attribution and reminder controls.',
        );
      case 4:
        return const _UnavailableFeaturePage(
          icon: Icons.person_outline,
          title: 'Your profile',
          message:
              'Sign-in and account features will be added with the shared authentication service.',
        );
      case 0:
      default:
        return _HomePage(
          onFindTemple: () => setState(() => _selectedIndex = 1),
        );
    }
  }
}

class _HomePage extends StatelessWidget {
  const _HomePage({required this.onFindTemple});

  final VoidCallback onFindTemple;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
      children: [
        Text(
          'Useful Jain community information, in one place.',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            color: brand900,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'Find approved public records and share reliable information with your community.',
          style: Theme.of(
            context,
          ).textTheme.bodyLarge?.copyWith(color: inkSecondary),
        ),
        const SizedBox(height: 24),
        FilledButton.icon(
          onPressed: onFindTemple,
          icon: const Icon(Icons.temple_hindu_outlined),
          label: const Text('Find a temple'),
        ),
        const SizedBox(height: 28),
        _SectionTitle(title: 'Explore JainConnect'),
        const SizedBox(height: 12),
        const _InfoCard(
          icon: Icons.verified_outlined,
          title: 'Approved information',
          message:
              'Published public records are shown only after the backend review boundary allows them.',
        ),
        const SizedBox(height: 12),
        const _InfoCard(
          icon: Icons.privacy_tip_outlined,
          title: 'Privacy before expansion',
          message:
              'Sensitive features will be added only with consent, access control, and lifecycle tests.',
        ),
      ],
    );
  }
}

class DiscoverPage extends StatefulWidget {
  const DiscoverPage({super.key, required this.apiClient});

  final TempleApiClient apiClient;

  @override
  State<DiscoverPage> createState() => _DiscoverPageState();
}

class _DiscoverPageState extends State<DiscoverPage> {
  final _queryController = TextEditingController();
  final _cityController = TextEditingController();
  late Future<TemplePage> _temples;

  @override
  void initState() {
    super.initState();
    _temples = _loadTemples();
  }

  @override
  void dispose() {
    _queryController.dispose();
    _cityController.dispose();
    super.dispose();
  }

  Future<TemplePage> _loadTemples() {
    return widget.apiClient.fetchTemples(
      query: _queryController.text,
      city: _cityController.text,
    );
  }

  void _search() {
    setState(() => _temples = _loadTemples());
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<TemplePage>(
      future: _temples,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return _ErrorState(
            message: snapshot.error is TempleApiException
                ? snapshot.error.toString()
                : 'The temple directory could not be loaded.',
            onRetry: _search,
          );
        }

        final page = snapshot.data;
        if (page == null || page.temples.isEmpty) {
          return _EmptyTempleState(onRetry: _search);
        }

        return ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          children: [
            Text(
              'Discover temples',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: brand900,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 16),
            _SearchForm(
              queryController: _queryController,
              cityController: _cityController,
              onSearch: _search,
            ),
            const SizedBox(height: 20),
            ...page.temples.map(
              (temple) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _TempleCard(
                  temple: temple,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => TempleDetailPage(temple: temple),
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _SearchForm extends StatelessWidget {
  const _SearchForm({
    required this.queryController,
    required this.cityController,
    required this.onSearch,
  });

  final TextEditingController queryController;
  final TextEditingController cityController;
  final VoidCallback onSearch;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: queryController,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(
                labelText: 'Temple or city',
                prefixIcon: Icon(Icons.search),
              ),
              onSubmitted: (_) => onSearch(),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: cityController,
              textInputAction: TextInputAction.search,
              decoration: const InputDecoration(labelText: 'City filter'),
              onSubmitted: (_) => onSearch(),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: onSearch,
                child: const Text('Search'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TempleCard extends StatelessWidget {
  const _TempleCard({required this.temple, required this.onTap});

  final PublicTemple temple;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        onTap: onTap,
        leading: const CircleAvatar(
          backgroundColor: brand100,
          child: Icon(Icons.temple_hindu_outlined, color: brand900),
        ),
        title: Text(
          temple.name,
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                temple.locationLabel.isEmpty
                    ? 'Location not supplied'
                    : temple.locationLabel,
              ),
              const SizedBox(height: 4),
              const Text(
                'Verified record',
                style: TextStyle(
                  color: success,
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
        trailing: const Icon(Icons.chevron_right),
      ),
    );
  }
}

class TempleDetailPage extends StatelessWidget {
  const TempleDetailPage({super.key, required this.temple});

  final PublicTemple temple;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Temple details')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
        children: [
          const _VerifiedLabel(),
          const SizedBox(height: 12),
          Text(
            temple.name,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: brand900,
              fontWeight: FontWeight.w700,
            ),
          ),
          if (temple.description != null) ...[
            const SizedBox(height: 12),
            Text(temple.description!),
          ],
          const SizedBox(height: 24),
          _DetailRow(label: 'Address', value: temple.addressLabel),
          if (temple.traditionOrLineage != null)
            _DetailRow(
              label: 'Tradition or lineage',
              value: temple.traditionOrLineage!,
            ),
          if (temple.darshanInformation != null)
            _DetailRow(
              label: 'Visitor information',
              value: temple.darshanInformation!,
            ),
          if (temple.publicPhone != null)
            _DetailRow(label: 'Public phone', value: temple.publicPhone!),
          if (temple.publicEmail != null)
            _DetailRow(label: 'Public email', value: temple.publicEmail!),
          _DetailRow(
            label: 'Last reviewed',
            value: temple.lastReviewedAt == null
                ? 'Review date not supplied'
                : MaterialLocalizations.of(
                    context,
                  ).formatFullDate(temple.lastReviewedAt!.toLocal()),
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    if (value.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.labelMedium?.copyWith(color: inkSecondary),
          ),
          const SizedBox(height: 4),
          Text(value),
          const Divider(height: 20),
        ],
      ),
    );
  }
}

class _VerifiedLabel extends StatelessWidget {
  const _VerifiedLabel();

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: const Color(0xFFE6F4EB),
          borderRadius: BorderRadius.circular(6),
        ),
        child: const Padding(
          padding: EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          child: Text(
            'Verified record',
            style: TextStyle(
              color: success,
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_outlined, size: 42, color: inkSecondary),
            const SizedBox(height: 12),
            Text(
              'Directory unavailable',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Try again'),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyTempleState extends StatelessWidget {
  const _EmptyTempleState({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.search_off_outlined,
              size: 42,
              color: inkSecondary,
            ),
            const SizedBox(height: 12),
            Text(
              'No approved temples found',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            const Text(
              'Try a different spelling or remove the city filter.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: onRetry,
              child: const Text('Search again'),
            ),
          ],
        ),
      ),
    );
  }
}

class _UnavailableFeaturePage extends StatelessWidget {
  const _UnavailableFeaturePage({
    required this.icon,
    required this.title,
    required this.message,
  });

  final IconData icon;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 42, color: brand900),
            const SizedBox(height: 12),
            Text(
              title,
              style: Theme.of(context).textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(message, textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({
    required this.icon,
    required this.title,
    required this.message,
  });

  final IconData icon;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Icon(icon, color: brand900),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Text(message),
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: Theme.of(context).textTheme.titleLarge?.copyWith(
        color: brand900,
        fontWeight: FontWeight.w700,
      ),
    );
  }
}
