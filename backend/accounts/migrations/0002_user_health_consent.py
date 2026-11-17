from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("accounts", "0001_initial")]
    operations = [
        migrations.AddField(
            model_name="user",
            name="health_consent_at",
            field=models.DateTimeField(null=True, editable=False),
        ),
        migrations.AddField(
            model_name="user",
            name="privacy_policy_version",
            field=models.CharField(max_length=32, blank=True, editable=False),
        ),
    ]
